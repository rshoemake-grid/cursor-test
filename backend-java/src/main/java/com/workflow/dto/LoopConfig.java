package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LoopConfig DTO - matches Python LoopConfig schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoopConfig {
    private String loopType = "for_each";
    private String itemsSource;
    private String condition;
    private Integer maxIterations = 0;
}
