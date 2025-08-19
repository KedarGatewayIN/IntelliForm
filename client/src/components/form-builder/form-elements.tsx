import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { FormField } from "@shared/schema";
import {
  GripVerticalIcon,
  XIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  StarIcon,
  UploadIcon,
  BotIcon,
  TypeIcon,
  AlignLeftIcon,
  MailIcon,
  HashIcon,
  CircleDotIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  TableIcon,
} from "lucide-react";
import { format } from "date-fns";

interface FormElementsProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
}

const fieldIcons = {
  text: TypeIcon,
  textarea: AlignLeftIcon,
  email: MailIcon,
  number: HashIcon,
  password: TypeIcon,
  url: TypeIcon,
  radio: CircleDotIcon,
  checkbox: CheckSquareIcon,
  select: ChevronDownIcon,
  date: CalendarIcon,
  file: UploadIcon,
  rating: StarIcon,
  slider: TypeIcon,
  ai_conversation: BotIcon,
  matrix: TableIcon,
};

export default function FormElements({
  field,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onMove,
}: FormElementsProps) {
  const [date, setDate] = useState<Date>();
  const [chatMessages, setChatMessages] = useState([
    { role: "user", content: "Hello, I need help with something." },
    {
      role: "assistant",
      content: "Hello! I'm here to help. What can I assist you with today?",
    },
  ]);

  const Icon = fieldIcons[field.type] || TypeIcon;

  const renderFieldPreview = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "number":
        return (
          <Input
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            type={
              field.type === "email"
                ? "email"
                : field.type === "number"
                ? "number"
                : "text"
            }
            disabled
          />
        );

      case "textarea":
        return (
          <Textarea
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            disabled
            rows={3}
          />
        );

      case "radio":
        return (
          <RadioGroup disabled>
            {(field.options || ["Option 1", "Option 2", "Option 3"]).map(
              (option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                  <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                </div>
              )
            )}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {(field.options || ["Option 1", "Option 2", "Option 3"]).map(
              (option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox id={`${field.id}-${index}`} disabled />
                  <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                </div>
              )
            )}
          </div>
        );

      case "select":
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {(field.options || ["Option 1", "Option 2", "Option 3"]).map(
                (option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                disabled
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case "rating":
        return (
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className="h-6 w-6 text-gray-300 hover:text-yellow-400 cursor-pointer transition-colors"
              />
            ))}
          </div>
        );

      case "file":
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <UploadIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Click to upload or drag and drop
            </p>
          </div>
        );

      case "ai_conversation":
        return (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="space-y-3 mb-3 max-h-32 overflow-y-auto">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs p-2 rounded-lg text-sm ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Type your message..."
                disabled
                className="flex-1"
              />
              <Button size="sm" disabled>
                <BotIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "matrix":
        const matrixRows = field.matrixRows || ["Row 1", "Row 2", "Row 3"];
        const matrixColumns = field.matrixColumns || ["1", "2", "3", "4", "5"];
        return (
          <div className="border border-gray-200 rounded-lg p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b"></th>
                  {matrixColumns.map((col, index) => (
                    <th
                      key={index}
                      className="text-center p-2 border-b font-medium text-gray-700 min-w-12"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-gray-100">
                    <td className="p-2 font-medium text-gray-700 bg-gray-50 min-w-32">
                      {row}
                    </td>
                    <RadioGroup className="contents">
                      {matrixColumns.map((_, colIndex) => (
                        <td key={colIndex} className="text-center p-2">
                          <RadioGroupItem
                            value={`${rowIndex}-${colIndex}`}
                            id={`${field.id}-${rowIndex}-${colIndex}`}
                            disabled
                          />
                        </td>
                      ))}
                    </RadioGroup>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return <Input placeholder="Unknown field type" disabled />;
    }
  };

  return (
    <Card
      className={`relative group cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm"
      } ${
        field.type === "ai_conversation"
          ? "border-purple-200 bg-gradient-to-r from-purple-50/30 to-blue-50/30"
          : ""
      }`}
      onClick={onSelect}
    >
      <div className="p-4">
        {/* Field Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Icon
              className={`h-4 w-4 ${
                field.type === "ai_conversation"
                  ? "text-secondary"
                  : "text-gray-500"
              }`}
            />
            <span className="font-medium text-gray-900">{field.label}</span>
            {field.required && <span className="text-red-500">*</span>}
            {field.aiEnabled && (
              <span className="text-xs bg-secondary text-white px-2 py-1 rounded-full">
                AI
              </span>
            )}
            {field.validation && field.validation.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {field.validation.length} validation{field.validation.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Controls */}
          <div
            className={`flex items-center space-x-1 ${
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            } transition-opacity`}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMove("up");
              }}
            >
              <ArrowUpIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMove("down");
              }}
            >
              <ArrowDownIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <XIcon className="h-3 w-3" />
            </Button>
            <GripVerticalIcon className="h-4 w-4 text-gray-400 cursor-move" />
          </div>
        </div>

        {/* Field Preview */}
        <div className="space-y-2">{renderFieldPreview()}</div>
      </div>
    </Card>
  );
}
