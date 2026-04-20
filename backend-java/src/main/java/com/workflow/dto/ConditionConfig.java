package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ConditionConfig DTO - matches Python ConditionConfig schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConditionConfig {
    @JsonProperty("condition_type")
    private String conditionType = "equals";
    private String field;
    private String value;
    @JsonProperty("true_branch")
    private String trueBranch;
    @JsonProperty("false_branch")
    private String falseBranch;
    @JsonProperty("custom_expression")
    private String customExpression;
}
