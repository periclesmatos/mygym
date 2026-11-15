package com.appgym.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({
            "/{page:^(?!api$)[^\\.]*}",
            "/{page:^(?!api$)[^\\.]*}/{detail:[^\\.]*}",
            "/{page:^(?!api$)[^\\.]*}/{detail:[^\\.]*}/{extra:[^\\.]*}"
    })
    public String index() {
        return "forward:/index.html";
    }
}
