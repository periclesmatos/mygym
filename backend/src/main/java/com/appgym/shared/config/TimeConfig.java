package com.appgym.shared.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** O relógio do app, no fuso que define onde um dia começa e termina. */
@Configuration
class TimeConfig {

    @Bean
    Clock clock(@Value("${app.timezone:America/Sao_Paulo}") String zone) {
        return Clock.system(ZoneId.of(zone));
    }
}
