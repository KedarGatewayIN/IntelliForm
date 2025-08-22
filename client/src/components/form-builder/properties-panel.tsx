import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { FormField } from "@shared/schema";
import { PlusIcon, XIcon, MousePointerIcon } from "lucide-react";

interface PropertiesPanelProps {
  selectedField: FormField | null;
  onUpdateField: (updates: Partial<FormField>) => void;
}

export default function PropertiesPanel({
  selectedField,
  onUpdateField,
}: PropertiesPanelProps) {
  if (!selectedField) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure the selected element
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <MousePointerIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Select an element</p>
            <p className="text-sm mt-1">
              Click on a form element to configure its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasOptions = ["radio", "checkbox", "select"].includes(
    selectedField.type,
  );
  const isMatrix = selectedField.type === "matrix";

  const addOption = () => {
    const options = selectedField.options || [];
    onUpdateField({
      options: [...options, `Option ${options.length + 1}`],
    });
  };

  const updateOption = (index: number, value: string) => {
    const options = [...(selectedField.options || [])];
    options[index] = value;
    onUpdateField({ options });
  };

  const removeOption = (index: number) => {
    const options = [...(selectedField.options || [])];
    options.splice(index, 1);
    onUpdateField({ options });
  };

  // Matrix field functions
  const addMatrixRow = () => {
    const rows = selectedField.matrixRows || [];
    onUpdateField({
      matrixRows: [...rows, `Row ${rows.length + 1}`],
    });
  };
  const updateMatrixRow = (index: number, value: string) => {
    const rows = [...(selectedField.matrixRows || [])];
    rows[index] = value;
    onUpdateField({ matrixRows: rows });
  };
  const removeMatrixRow = (index: number) => {
    const rows = [...(selectedField.matrixRows || [])];
    rows.splice(index, 1);
    onUpdateField({ matrixRows: rows });
  };
  const addMatrixColumn = () => {
    const columns = selectedField.matrixColumns || [];
    onUpdateField({
      matrixColumns: [...columns, `${columns.length + 1}`],
    });
  };
  const updateMatrixColumn = (index: number, value: string) => {
    const columns = [...(selectedField.matrixColumns || [])];
    columns[index] = value;
    onUpdateField({ matrixColumns: columns });
  };
  const removeMatrixColumn = (index: number) => {
    const columns = [...(selectedField.matrixColumns || [])];
    columns.splice(index, 1);
    onUpdateField({ matrixColumns: columns });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure the selected element
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Properties */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Basic Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field-label">Field Label</Label>
              <Input
                id="field-label"
                value={selectedField.label}
                onChange={(e) => onUpdateField({ label: e.target.value })}
                placeholder="Enter field label"
              />
            </div>

            {selectedField.type !== "ai_conversation" && (
              <div className="space-y-2">
                <Label htmlFor="field-placeholder">Placeholder Text</Label>
                <Input
                  id="field-placeholder"
                  value={selectedField.placeholder || ""}
                  onChange={(e) =>
                    onUpdateField({ placeholder: e.target.value })
                  }
                  placeholder="Enter placeholder text"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Required Field</Label>
                <p className="text-xs text-gray-500">
                  Users must fill this field
                </p>
              </div>
              <Switch
                checked={selectedField.required}
                onCheckedChange={(required) => onUpdateField({ required })}
              />
            </div>

            {selectedField.type === "textarea" && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable AI Assistance</Label>
                  <p className="text-xs text-gray-500">
                    Add conversational AI to this field
                  </p>
                </div>
                <Switch
                  checked={selectedField.aiEnabled || false}
                  onCheckedChange={(aiEnabled) => onUpdateField({ aiEnabled })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Options for choice fields */}
        {hasOptions && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(selectedField.options || []).map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Matrix configuration */}
        {isMatrix && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Matrix Rows</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(selectedField.matrixRows || []).map((row, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={row}
                      onChange={(e) => updateMatrixRow(index, e.target.value)}
                      placeholder={`Row ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMatrixRow(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addMatrixRow}
                  className="w-full"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Matrix Columns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(selectedField.matrixColumns || []).map((column, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={column}
                      onChange={(e) =>
                        updateMatrixColumn(index, e.target.value)
                      }
                      placeholder={`Column ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMatrixColumn(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addMatrixColumn}
                  className="w-full"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Field Type Badge */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Field Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Badge variant="secondary" className="w-fit">
                {selectedField.type.replace("_", " ").toUpperCase()}
              </Badge>
              {selectedField.aiEnabled && (
                <Badge
                  variant="outline"
                  className="w-fit ml-2 border-purple-200 text-purple-700"
                >
                  AI ENABLED
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Validation Rules */}
        {["text", "email", "number", "textarea"].includes(
          selectedField.type,
        ) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Text field validations */}
              {selectedField.type === "text" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="min-length">Minimum Length</Label>
                    <Input
                      id="min-length"
                      type="number"
                      placeholder="No minimum"
                      value={
                        selectedField.validation?.find(
                          (rule) => rule.type === "min",
                        )?.value || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const currentValidation =
                          selectedField.validation || [];
                        const existingMinRule = currentValidation.find(
                          (rule) => rule.type === "min",
                        );

                        if (value && Number(value) > 0) {
                          if (existingMinRule) {
                            // Update existing min rule
                            const updatedValidation = currentValidation.map(
                              (rule) =>
                                rule.type === "min"
                                  ? {
                                      ...rule,
                                      value: Number(value),
                                      message: `Minimum ${value} characters required`,
                                    }
                                  : rule,
                            );
                            onUpdateField({ validation: updatedValidation });
                          } else {
                            // Add new min rule
                            onUpdateField({
                              validation: [
                                ...currentValidation,
                                {
                                  type: "min",
                                  value: Number(value),
                                  message: `Minimum ${value} characters required`,
                                },
                              ],
                            });
                          }
                        } else {
                          // Remove min rule if value is empty or 0
                          const updatedValidation = currentValidation.filter(
                            (rule) => rule.type !== "min",
                          );
                          onUpdateField({ validation: updatedValidation });
                        }
                      }}
                    />
                    {selectedField.validation?.find(
                      (rule) => rule.type === "min",
                    ) && (
                      <Input
                        placeholder="Custom error message"
                        value={
                          selectedField.validation?.find(
                            (rule) => rule.type === "min",
                          )?.message || ""
                        }
                        onChange={(e) => {
                          const message = e.target.value;
                          const currentValidation =
                            selectedField.validation || [];
                          const updatedValidation = currentValidation.map(
                            (rule) =>
                              rule.type === "min"
                                ? {
                                    ...rule,
                                    message:
                                      message ||
                                      `Minimum ${rule.value} characters required`,
                                  }
                                : rule,
                          );
                          onUpdateField({ validation: updatedValidation });
                        }}
                        className="text-sm"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-length">Maximum Length</Label>
                    <Input
                      id="max-length"
                      type="number"
                      placeholder="No maximum"
                      value={
                        selectedField.validation?.find(
                          (rule) => rule.type === "max",
                        )?.value || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const currentValidation =
                          selectedField.validation || [];
                        const existingMaxRule = currentValidation.find(
                          (rule) => rule.type === "max",
                        );

                        if (value && Number(value) > 0) {
                          if (existingMaxRule) {
                            // Update existing max rule
                            const updatedValidation = currentValidation.map(
                              (rule) =>
                                rule.type === "max"
                                  ? {
                                      ...rule,
                                      value: Number(value),
                                      message: `Maximum ${value} characters allowed`,
                                    }
                                  : rule,
                            );
                            onUpdateField({ validation: updatedValidation });
                          } else {
                            // Add new max rule
                            onUpdateField({
                              validation: [
                                ...currentValidation,
                                {
                                  type: "max",
                                  value: Number(value),
                                  message: `Maximum ${value} characters allowed`,
                                },
                              ],
                            });
                          }
                        } else {
                          // Remove max rule if value is empty or 0
                          const updatedValidation = currentValidation.filter(
                            (rule) => rule.type !== "max",
                          );
                          onUpdateField({ validation: updatedValidation });
                        }
                      }}
                    />
                    {selectedField.validation?.find(
                      (rule) => rule.type === "max",
                    ) && (
                      <Input
                        placeholder="Custom error message"
                        value={
                          selectedField.validation?.find(
                            (rule) => rule.type === "max",
                          )?.message || ""
                        }
                        onChange={(e) => {
                          const message = e.target.value;
                          const currentValidation =
                            selectedField.validation || [];
                          const updatedValidation = currentValidation.map(
                            (rule) =>
                              rule.type === "max"
                                ? {
                                    ...rule,
                                    message:
                                      message ||
                                      `Maximum ${rule.value} characters allowed`,
                                  }
                                : rule,
                          );
                          onUpdateField({ validation: updatedValidation });
                        }}
                        className="text-sm"
                      />
                    )}
                  </div>

                  {/* Pattern Validation for text fields */}
                  <div className="space-y-2">
                    <Label htmlFor="pattern">Custom Pattern (Regex)</Label>
                    <Input
                      id="pattern"
                      type="text"
                      placeholder="e.g., ^[A-Za-z]+$ for letters only"
                      value={
                        selectedField.validation?.find(
                          (rule) => rule.type === "pattern",
                        )?.value || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const currentValidation =
                          selectedField.validation || [];
                        const existingPatternRule = currentValidation.find(
                          (rule) => rule.type === "pattern",
                        );

                        if (value && value.trim()) {
                          if (existingPatternRule) {
                            // Update existing pattern rule
                            const updatedValidation = currentValidation.map(
                              (rule) =>
                                rule.type === "pattern"
                                  ? { ...rule, value: value.trim() }
                                  : rule,
                            );
                            onUpdateField({ validation: updatedValidation });
                          } else {
                            // Add new pattern rule
                            onUpdateField({
                              validation: [
                                ...currentValidation,
                                {
                                  type: "pattern",
                                  value: value.trim(),
                                  message:
                                    "Input does not match the required pattern",
                                },
                              ],
                            });
                          }
                        } else {
                          // Remove pattern rule if value is empty
                          const updatedValidation = currentValidation.filter(
                            (rule) => rule.type !== "pattern",
                          );
                          onUpdateField({ validation: updatedValidation });
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Enter a regular expression pattern for custom validation
                    </p>
                  </div>

                  {/* URL Validation for text fields */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>URL Validation</Label>
                      <p className="text-xs text-gray-500">
                        Validate URL format
                      </p>
                    </div>
                    <Switch
                      checked={
                        selectedField.validation?.some(
                          (rule) => rule.type === "url",
                        ) || false
                      }
                      onCheckedChange={(checked) => {
                        const currentValidation =
                          selectedField.validation || [];

                        if (checked) {
                          // Add URL validation rule if it doesn't exist
                          if (
                            !currentValidation.some(
                              (rule) => rule.type === "url",
                            )
                          ) {
                            onUpdateField({
                              validation: [
                                ...currentValidation,
                                {
                                  type: "url",
                                  value: "",
                                  message: "Please enter a valid URL",
                                },
                              ],
                            });
                          }
                        } else {
                          // Remove URL validation rule
                          const updatedValidation = currentValidation.filter(
                            (rule) => rule.type !== "url",
                          );
                          onUpdateField({ validation: updatedValidation });
                        }
                      }}
                    />
                  </div>

                  {/* Number Validation for text fields */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Number Validation</Label>
                      <p className="text-xs text-gray-500">
                        Ensure input is a valid number
                      </p>
                    </div>
                    <Switch
                      checked={
                        selectedField.validation?.some(
                          (rule) =>
                            rule.type === "pattern" &&
                            rule.value === "^[0-9]+$",
                        ) || false
                      }
                      onCheckedChange={(checked) => {
                        const currentValidation =
                          selectedField.validation || [];

                        if (checked) {
                          // Add number validation rule if it doesn't exist
                          if (
                            !currentValidation.some(
                              (rule) =>
                                rule.type === "pattern" &&
                                rule.value === "^[0-9]+$",
                            )
                          ) {
                            onUpdateField({
                              validation: [
                                ...currentValidation,
                                {
                                  type: "pattern",
                                  value: "^[0-9]+$",
                                  message:
                                    "Please enter a valid number (digits only)",
                                },
                              ],
                            });
                          }
                        } else {
                          // Remove number validation rule
                          const updatedValidation = currentValidation.filter(
                            (rule) =>
                              !(
                                rule.type === "pattern" &&
                                rule.value === "^[0-9]+$"
                              ),
                          );
                          onUpdateField({ validation: updatedValidation });
                        }
                      }}
                    />
                  </div>
                </>
              )}

              {/* Textarea field validations */}
              {selectedField.type === "textarea" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="min-length">Minimum Length</Label>
                    <Input
                      id="min-length"
                      type="number"
                      placeholder="No minimum"
                      value={
                        selectedField.validation?.find(
                          (rule) => rule.type === "min",
                        )?.value || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const currentValidation =
                          selectedField.validation || [];
                        const existingMinRule = currentValidation.find(
                          (rule) => rule.type === "min",
                        );

                        if (value && Number(value) > 0) {
                          if (existingMinRule) {
                            // Update existing min rule
                            const updatedValidation = currentValidation.map(
                              (rule) =>
                                rule.type === "min"
                                  ? {
                                      ...rule,
                                      value: Number(value),
                                      message: `Minimum ${value} characters required`,
                                    }
                                  : rule,
                            );
                            onUpdateField({ validation: updatedValidation });
                          } else {
                            // Add new min rule
                            onUpdateField({
                              validation: [
                                ...currentValidation,
                                {
                                  type: "min",
                                  value: Number(value),
                                  message: `Minimum ${value} characters required`,
                                },
                              ],
                            });
                          }
                        } else {
                          // Remove min rule if value is empty or 0
                          const updatedValidation = currentValidation.filter(
                            (rule) => rule.type !== "min",
                          );
                          onUpdateField({ validation: updatedValidation });
                        }
                      }}
                    />
                    {selectedField.validation?.find(
                      (rule) => rule.type === "min",
                    ) && (
                      <Input
                        placeholder="Custom error message"
                        value={
                          selectedField.validation?.find(
                            (rule) => rule.type === "min",
                          )?.message || ""
                        }
                        onChange={(e) => {
                          const message = e.target.value;
                          const currentValidation =
                            selectedField.validation || [];
                          const updatedValidation = currentValidation.map(
                            (rule) =>
                              rule.type === "min"
                                ? {
                                    ...rule,
                                    message:
                                      message ||
                                      `Minimum ${rule.value} characters required`,
                                  }
                                : rule,
                          );
                          onUpdateField({ validation: updatedValidation });
                        }}
                        className="text-sm"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-length">Maximum Length</Label>
                    <Input
                      id="max-length"
                      type="number"
                      placeholder="No maximum"
                      value={
                        selectedField.validation?.find(
                          (rule) => rule.type === "max",
                        )?.value || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const currentValidation =
                          selectedField.validation || [];
                        const existingMaxRule = currentValidation.find(
                          (rule) => rule.type === "max",
                        );

                        if (value && Number(value) > 0) {
                          if (existingMaxRule) {
                            // Update existing max rule
                            const updatedValidation = currentValidation.map(
                              (rule) =>
                                rule.type === "max"
                                  ? {
                                      ...rule,
                                      value: Number(value),
                                      message: `Maximum ${value} characters allowed`,
                                    }
                                  : rule,
                            );
                            onUpdateField({ validation: updatedValidation });
                          } else {
                            // Add new max rule
                            onUpdateField({
                              validation: [
                                ...currentValidation,
                                {
                                  type: "max",
                                  value: Number(value),
                                  message: `Maximum ${value} characters allowed`,
                                },
                              ],
                            });
                          }
                        } else {
                          // Remove max rule if value is empty or 0
                          const updatedValidation = currentValidation.filter(
                            (rule) => rule.type !== "max",
                          );
                          onUpdateField({ validation: updatedValidation });
                        }
                      }}
                    />
                    {selectedField.validation?.find(
                      (rule) => rule.type === "max",
                    ) && (
                      <Input
                        placeholder="Custom error message"
                        value={
                          selectedField.validation?.find(
                            (rule) => rule.type === "max",
                          )?.message || ""
                        }
                        onChange={(e) => {
                          const message = e.target.value;
                          const currentValidation =
                            selectedField.validation || [];
                          const updatedValidation = currentValidation.map(
                            (rule) =>
                              rule.type === "max"
                                ? {
                                    ...rule,
                                    message:
                                      message ||
                                      `Maximum ${rule.value} characters allowed`,
                                  }
                                : rule,
                          );
                          onUpdateField({ validation: updatedValidation });
                        }}
                        className="text-sm"
                      />
                    )}
                  </div>
                </>
              )}

              {/* Email field validations */}
              {selectedField.type === "email" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="min-length">Minimum Length</Label>
                    <Input
                      id="min-length"
                      type="number"
                      placeholder="No minimum"
                      value={
                        selectedField.validation?.find(
                          (rule) => rule.type === "min",
                        )?.value || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const currentValidation =
                          selectedField.validation || [];
                        const existingMinRule = currentValidation.find(
                          (rule) => rule.type === "min",
                        );

                        if (value && Number(value) > 0) {
                          if (existingMinRule) {
                            // Update existing min rule
                            const updatedValidation = currentValidation.map(
                              (rule) =>
                                rule.type === "min"
                                  ? {
                                      ...rule,
                                      value: Number(value),
                                      message: `Minimum ${value} characters required`,
                                    }
                                  : rule,
                            );
                            onUpdateField({ validation: updatedValidation });
                          } else {
                            // Add new min rule
                            onUpdateField({
                              validation: [
                                ...currentValidation,
                                {
                                  type: "min",
                                  value: Number(value),
                                  message: `Minimum ${value} characters required`,
                                },
                              ],
                            });
                          }
                        } else {
                          // Remove min rule if value is empty or 0
                          const updatedValidation = currentValidation.filter(
                            (rule) => rule.type !== "min",
                          );
                          onUpdateField({ validation: updatedValidation });
                        }
                      }}
                    />
                    {selectedField.validation?.find(
                      (rule) => rule.type === "min",
                    ) && (
                      <Input
                        placeholder="Custom error message"
                        value={
                          selectedField.validation?.find(
                            (rule) => rule.type === "min",
                          )?.message || ""
                        }
                        onChange={(e) => {
                          const message = e.target.value;
                          const currentValidation =
                            selectedField.validation || [];
                          const updatedValidation = currentValidation.map(
                            (rule) =>
                              rule.type === "min"
                                ? {
                                    ...rule,
                                    message:
                                      message ||
                                      `Minimum ${rule.value} characters required`,
                                  }
                                : rule,
                          );
                          onUpdateField({ validation: updatedValidation });
                        }}
                        className="text-sm"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-length">Maximum Length</Label>
                    <Input
                      id="max-length"
                      type="number"
                      placeholder="No maximum"
                      value={
                        selectedField.validation?.find(
                          (rule) => rule.type === "max",
                        )?.value || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const currentValidation =
                          selectedField.validation || [];
                        const existingMaxRule = currentValidation.find(
                          (rule) => rule.type === "max",
                        );

                        if (value && Number(value) > 0) {
                          if (existingMaxRule) {
                            // Update existing max rule
                            const updatedValidation = currentValidation.map(
                              (rule) =>
                                rule.type === "max"
                                  ? {
                                      ...rule,
                                      value: Number(value),
                                      message: `Maximum ${value} characters allowed`,
                                    }
                                  : rule,
                            );
                            onUpdateField({ validation: updatedValidation });
                          } else {
                            // Add new max rule
                            onUpdateField({
                              validation: [
                                ...currentValidation,
                                {
                                  type: "max",
                                  value: Number(value),
                                  message: `Maximum ${value} characters allowed`,
                                },
                              ],
                            });
                          }
                        } else {
                          // Remove max rule if value is empty or 0
                          const updatedValidation = currentValidation.filter(
                            (rule) => rule.type !== "max",
                          );
                          onUpdateField({ validation: updatedValidation });
                        }
                      }}
                    />
                    {selectedField.validation?.find(
                      (rule) => rule.type === "max",
                    ) && (
                      <Input
                        placeholder="Custom error message"
                        value={
                          selectedField.validation?.find(
                            (rule) => rule.type === "max",
                          )?.message || ""
                        }
                        onChange={(e) => {
                          const message = e.target.value;
                          const currentValidation =
                            selectedField.validation || [];
                          const updatedValidation = currentValidation.map(
                            (rule) =>
                              rule.type === "max"
                                ? {
                                    ...rule,
                                    message:
                                      message ||
                                      `Maximum ${rule.value} characters allowed`,
                                  }
                                : rule,
                          );
                          onUpdateField({ validation: updatedValidation });
                        }}
                        className="text-sm"
                      />
                    )}
                  </div>

                  {/* Email Validation */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Validation</Label>
                      <p className="text-xs text-gray-500">
                        Validate email format
                      </p>
                    </div>
                    <Switch
                      checked={
                        selectedField.validation?.some(
                          (rule) => rule.type === "email",
                        ) || false
                      }
                      onCheckedChange={(checked) => {
                        const currentValidation =
                          selectedField.validation || [];

                        if (checked) {
                          // Add email validation rule if it doesn't exist
                          if (
                            !currentValidation.some(
                              (rule) => rule.type === "email",
                            )
                          ) {
                            onUpdateField({
                              validation: [
                                ...currentValidation,
                                {
                                  type: "email",
                                  value: "",
                                  message: "Please enter a valid email address",
                                },
                              ],
                            });
                          }
                        } else {
                          // Remove email validation rule
                          const updatedValidation = currentValidation.filter(
                            (rule) => rule.type !== "email",
                          );
                          onUpdateField({ validation: updatedValidation });
                        }
                      }}
                    />
                  </div>
                </>
              )}

              {/* Number field validations */}
              {selectedField.type === "number" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="min-value">Minimum Value</Label>
                    <Input
                      id="min-value"
                      type="number"
                      placeholder="No minimum"
                      value={
                        selectedField.validation?.find(
                          (rule) => rule.type === "min",
                        )?.value || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const currentValidation =
                          selectedField.validation || [];
                        const existingMinRule = currentValidation.find(
                          (rule) => rule.type === "min",
                        );

                        if (value && value !== "") {
                          if (existingMinRule) {
                            // Update existing min rule
                            const updatedValidation = currentValidation.map(
                              (rule) =>
                                rule.type === "min"
                                  ? {
                                      ...rule,
                                      value: Number(value),
                                      message: `Minimum value is ${value}`,
                                    }
                                  : rule,
                            );
                            onUpdateField({ validation: updatedValidation });
                          } else {
                            // Add new min rule
                            onUpdateField({
                              validation: [
                                ...currentValidation,
                                {
                                  type: "min",
                                  value: Number(value),
                                  message: `Minimum value is ${value}`,
                                },
                              ],
                            });
                          }
                        } else {
                          // Remove min rule if value is empty
                          const updatedValidation = currentValidation.filter(
                            (rule) => rule.type !== "min",
                          );
                          onUpdateField({ validation: updatedValidation });
                        }
                      }}
                    />
                    {selectedField.validation?.find(
                      (rule) => rule.type === "min",
                    ) && (
                      <Input
                        placeholder="Custom error message"
                        value={
                          selectedField.validation?.find(
                            (rule) => rule.type === "min",
                          )?.message || ""
                        }
                        onChange={(e) => {
                          const message = e.target.value;
                          const currentValidation =
                            selectedField.validation || [];
                          const updatedValidation = currentValidation.map(
                            (rule) =>
                              rule.type === "min"
                                ? {
                                    ...rule,
                                    message:
                                      message ||
                                      `Minimum value is ${rule.value}`,
                                  }
                                : rule,
                          );
                          onUpdateField({ validation: updatedValidation });
                        }}
                        className="text-sm"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-value">Maximum Value</Label>
                    <Input
                      id="max-value"
                      type="number"
                      placeholder="No maximum"
                      value={
                        selectedField.validation?.find(
                          (rule) => rule.type === "max",
                        )?.value || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const currentValidation =
                          selectedField.validation || [];
                        const existingMaxRule = currentValidation.find(
                          (rule) => rule.type === "max",
                        );

                        if (value && value !== "") {
                          if (existingMaxRule) {
                            // Update existing max rule
                            const updatedValidation = currentValidation.map(
                              (rule) =>
                                rule.type === "max"
                                  ? {
                                      ...rule,
                                      value: Number(value),
                                      message: `Maximum value is ${value}`,
                                    }
                                  : rule,
                            );
                            onUpdateField({ validation: updatedValidation });
                          } else {
                            // Add new max rule
                            onUpdateField({
                              validation: [
                                ...currentValidation,
                                {
                                  type: "max",
                                  value: Number(value),
                                  message: `Maximum value is ${value}`,
                                },
                              ],
                            });
                          }
                        } else {
                          // Remove max rule if value is empty
                          const updatedValidation = currentValidation.filter(
                            (rule) => rule.type !== "max",
                          );
                          onUpdateField({ validation: updatedValidation });
                        }
                      }}
                    />
                    {selectedField.validation?.find(
                      (rule) => rule.type === "max",
                    ) && (
                      <Input
                        placeholder="Custom error message"
                        value={
                          selectedField.validation?.find(
                            (rule) => rule.type === "max",
                          )?.message || ""
                        }
                        onChange={(e) => {
                          const message = e.target.value;
                          const currentValidation =
                            selectedField.validation || [];
                          const updatedValidation = currentValidation.map(
                            (rule) =>
                              rule.type === "max"
                                ? {
                                    ...rule,
                                    message:
                                      message ||
                                      `Maximum value is ${rule.value}`,
                                  }
                                : rule,
                          );
                          onUpdateField({ validation: updatedValidation });
                        }}
                        className="text-sm"
                      />
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
