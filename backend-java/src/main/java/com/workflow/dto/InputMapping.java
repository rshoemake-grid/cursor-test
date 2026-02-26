package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * InputMapping DTO - matches Python InputMapping schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InputMapping {
    private String name;
    private String sourceNode;
    private String sourceField = "output";
}
