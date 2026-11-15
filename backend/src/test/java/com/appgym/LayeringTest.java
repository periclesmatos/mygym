package com.appgym;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;

/**
 * Regra de dependência da Clean Architecture dentro de cada módulo:
 *
 * <pre>
 *   web ──► application ──► domain ◄── infrastructure
 * </pre>
 *
 * O domínio não conhece Spring nem as outras camadas (as entidades usam só anotações JPA).
 * O ArchUnit vem junto com o Spring Modulith.
 */
class LayeringTest {
    static final JavaClasses CLASSES = new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages("com.appgym");

    @Test
    void domainDependsOnNothingOutsideIt() {
        noClasses()
                .that()
                .resideInAPackage("..domain..")
                .should()
                .dependOnClassesThat()
                .resideInAnyPackage("..application..", "..infrastructure..", "..web..", "org.springframework..")
                .check(CLASSES);
    }

    @Test
    void applicationDoesNotKnowAdapters() {
        noClasses()
                .that()
                .resideInAPackage("..application..")
                .should()
                .dependOnClassesThat()
                .resideInAnyPackage("..infrastructure..", "..web..")
                .check(CLASSES);
    }

    @Test
    void adaptersDoNotKnowEachOther() {
        noClasses()
                .that()
                .resideInAPackage("..web..")
                .should()
                .dependOnClassesThat()
                .resideInAPackage("..infrastructure..")
                .check(CLASSES);
        noClasses()
                .that()
                .resideInAPackage("..infrastructure..")
                .should()
                .dependOnClassesThat()
                .resideInAPackage("..web..")
                .check(CLASSES);
    }
}
