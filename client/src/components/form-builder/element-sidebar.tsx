import { Input } from "@/components/ui/input";
import { SearchIcon, TypeIcon, AlignLeftIcon, MailIcon, HashIcon, CircleDotIcon, CheckSquareIcon, ChevronDownIcon, CalendarIcon, StarIcon, UploadIcon, BotIcon, TableIcon } from "lucide-react";

interface ElementSidebarProps {
  onAddField: (fieldType: string) => void;
}

const formElements = [
  {
    category: "Basic Elements",
    items: [
      { type: "text", label: "Text Input", icon: TypeIcon },
      { type: "textarea", label: "Text Area", icon: AlignLeftIcon },
      { type: "email", label: "Email", icon: MailIcon },
      { type: "number", label: "Number", icon: HashIcon },
    ]
  },
  {
    category: "Choice Elements", 
    items: [
      { type: "radio", label: "Multiple Choice", icon: CircleDotIcon },
      { type: "checkbox", label: "Checkboxes", icon: CheckSquareIcon },
      { type: "select", label: "Dropdown", icon: ChevronDownIcon },
    ]
  },
  {
    category: "Advanced Elements",
    items: [
      { type: "matrix", label: "Matrix/Table", icon: TableIcon },
      { type: "ai_conversation", label: "AI Conversation", icon: BotIcon, special: true },
      { type: "date", label: "Date Picker", icon: CalendarIcon },
      { type: "rating", label: "Rating Scale", icon: StarIcon },
      { type: "file", label: "File Upload", icon: UploadIcon },
    ]
  }
];

export default function ElementSidebar({ onAddField }: ElementSidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Elements</h2>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search elements..."
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {formElements.map((category) => (
            <div key={category.category}>
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.type}
                      onClick={() => onAddField(item.type)}
                      className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${
                        item.special 
                          ? 'bg-gradient-to-r from-secondary/10 to-primary/10 border-purple-200 hover:from-secondary/20 hover:to-primary/20'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 ${item.special ? 'text-secondary' : 'text-gray-500'}`} />
                        <span className="ml-3 text-sm font-medium text-gray-700">{item.label}</span>
                        {item.special && (
                          <span className="ml-auto text-xs bg-secondary text-white px-2 py-1 rounded-full">AI</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
