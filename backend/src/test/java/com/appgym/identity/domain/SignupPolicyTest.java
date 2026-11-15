package com.appgym.identity.domain;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.appgym.shared.error.ForbiddenException;
import org.junit.jupiter.api.Test;

class SignupPolicyTest {

    static SignupPolicy policy(String allowed) {
        return SignupPolicy.of(allowed);
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
