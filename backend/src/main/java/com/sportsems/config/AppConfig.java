package com.sportsems.config;

import com.sportsems.service.EventCategoryService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    // Seeds the menu-driven event category list on first startup so the
    // "type of event" dropdown is never empty for organizers/users.
    @Bean
    public CommandLineRunner seedEventCategories(EventCategoryService categoryService) {
        return args -> categoryService.seedDefaultsIfEmpty(List.of(
                "Sports",
                "Cultural Fest",
                "Family Function",
                "Comedy",
                "Concert",
                "Get Together"
        ));
    }
}
