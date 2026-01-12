
import * as React from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List } from "lucide-react"

interface MarkdownEditorProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const MarkdownEditor = React.forwardRef<HTMLTextAreaElement, MarkdownEditorProps>(
    ({ className, value, onChange, ...props }, ref) => {
        const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

        // Merge refs
        React.useImperativeHandle(ref, () => textareaRef.current!)

        const insertFormatting = (prefix: string, suffix: string = "") => {
            const textarea = textareaRef.current
            if (!textarea) return

            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const text = textarea.value
            const before = text.substring(0, start)
            const selected = text.substring(start, end)
            const after = text.substring(end)

            // Handle list logic specifically for better UX (adding newline if needed)
            let newText = ""
            let newCursorPos = 0

            if (prefix === "- " && start === end) {
                // If creating a new list item on a new line
                const isStartOfLine = start === 0 || text[start - 1] === '\n'
                const effectivePrefix = isStartOfLine ? "- " : "\n- "
                newText = before + effectivePrefix + selected + suffix + after
                newCursorPos = start + effectivePrefix.length + selected.length + suffix.length
            } else {
                newText = before + prefix + selected + suffix + after
                newCursorPos = start + prefix.length + selected.length + suffix.length
            }

            // Create a synthetic event to trigger onChange for parent state
            if (onChange) {
                const event = {
                    target: { value: newText },
                    currentTarget: { value: newText }
                } as React.ChangeEvent<HTMLTextAreaElement>
                onChange(event)
            }

            // Must run after render to set focus and selection
            setTimeout(() => {
                textarea.focus()
                textarea.setSelectionRange(newCursorPos, newCursorPos)
            }, 0)
        }

        return (
            <div className={cn("grid gap-2", className)}>
                <div className="flex items-center gap-1 border-b pb-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertFormatting("**", "**")}
                        title="Bold"
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertFormatting("*", "*")}
                        title="Italic"
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertFormatting("- ")}
                        title="Bullet List"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <span className="ml-auto text-xs text-muted-foreground">Markdown Supported</span>
                </div>
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={onChange}
                    className={cn("min-h-[150px] font-mono text-sm", className)} // Added min-h and font-mono for code-like feel
                    {...props}
                />
            </div>
        )
    }
)
MarkdownEditor.displayName = "MarkdownEditor"

export { MarkdownEditor }
