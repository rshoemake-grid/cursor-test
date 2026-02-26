package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
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
    private String conditionType = "equals";
    private String field;
    private String value;
    private String trueBranch;
    private String falseBranch;
    private String customExpression;
}
