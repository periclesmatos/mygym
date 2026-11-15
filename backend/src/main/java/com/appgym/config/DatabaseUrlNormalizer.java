package com.appgym.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Accepts a JDBC URL and the postgres URL most hosts provide
 * ({@code postgresql://user:password@host:5432/appgym}).
 */
public class DatabaseUrlNormalizer implements EnvironmentPostProcessor, Ordered {

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String url = environment.getProperty("DATABASE_URL");
        if (url == null || url.isBlank()) {
            return;
        }

        Map<String, Object> properties = new HashMap<>();
        if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
            applyProviderUrl(url, properties);
        } else {
            properties.put("spring.datasource.url", url);
        }
        copy(environment, "DATABASE_USER", "spring.datasource.username", properties);
        copy(environment, "DATABASE_PASSWORD", "spring.datasource.password", properties);
        environment.getPropertySources().addFirst(new MapPropertySource("databaseUrl", properties));
    }

    private void applyProviderUrl(String url, Map<String, Object> properties) {
        URI uri = URI.create("http://" + url.replaceFirst("^postgres(ql)?://", ""));
        if (uri.getHost() == null || uri.getPath() == null || uri.getPath().length() < 2) {
            throw new IllegalStateException("Invalid DATABASE_URL: " + url);
        }

        String userInfo = uri.getRawUserInfo();
        if (userInfo != null) {
            int separator = userInfo.indexOf(':');
            if (separator >= 0) {
                properties.put("spring.datasource.username", decode(userInfo.substring(0, separator)));
                properties.put("spring.datasource.password", decode(userInfo.substring(separator + 1)));
            } else {
                properties.put("spring.datasource.username", decode(userInfo));
            }
        }

        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String jdbc = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath();
        if (uri.getRawQuery() != null) {
            jdbc += "?" + uri.getRawQuery();
        }
        properties.put("spring.datasource.url", jdbc);
    }

    private void copy(ConfigurableEnvironment environment, String sourceKey, String target, Map<String, Object> properties) {
        String value = environment.getProperty(sourceKey);
        if (value != null && !value.isBlank()) {
            properties.put(target, value);
        }
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
