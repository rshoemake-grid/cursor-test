package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonProperty("loop_type")
    private String loopType = "for_each";
    @JsonProperty("items_source")
    private String itemsSource;
    private String condition;
    @JsonProperty("max_iterations")
    private Integer maxIterations = 0;
}
