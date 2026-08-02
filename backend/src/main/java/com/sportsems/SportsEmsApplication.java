package com.sportsems;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SportsEmsApplication {
    public static void main(String[] args) {
        SpringApplication.run(SportsEmsApplication.class, args);
    }
}
