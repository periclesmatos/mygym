package com.appgym.auth.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.appgym.shared.config.AppProperties;
import com.appgym.shared.error.ForbiddenException;
import java.util.List;
import org.junit.jupiter.api.Test;

class SignupPolicyTest {

    static SignupPolicy policy(String allowed) {
        return new SignupPolicy(new AppProperties(
                null,
                new AppProperties.Signup(allowed),
                new AppProperties.Google(""),
                new AppProperties.Apple("", ""),
                new AppProperties.Jwt("x", 1),
                new AppProperties.Cors(List.of())));
    }

    @Test
    void allowsListedEmailsIgnoringCaseAndSpaces() {
        SignupPolicy policy = policy(" Ana@x.com , bea@x.com,, ");
        assertThatCode(() -> policy.assertAllowed("ana@x.com")).doesNotThrowAnyException();
        assertThatCode(() -> policy.assertAllowed("  BEA@X.COM ")).doesNotThrowAnyException();
    }

    @Test
    void rejectsOthers() {
        assertThatThrownBy(() -> policy("ana@x.com").assertAllowed("caio@x.com"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void emptyListClosesSignup() {
        assertThatThrownBy(() -> policy("").assertAllowed("ana@x.com")).isInstanceOf(ForbiddenException.class);
    }
}
