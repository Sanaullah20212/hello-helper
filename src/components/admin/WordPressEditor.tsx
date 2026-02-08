import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Minus,
  Type,
  Eye,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WordPressEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const ToolbarButton = ({
  onClick,
  isActive,
  icon: Icon,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  icon: React.ElementType;
  title: string;
}) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={`p-1.5 rounded hover:bg-muted transition-colors ${
            isActive ? "bg-primary/20 text-primary" : "text-muted-foreground"
          }`}
        >
          <Icon className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{title}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const ToolbarDivider = () => (
  <div className="w-px h-6 bg-border mx-1" />
);

const WordPressEditor = ({ content, onChange }: WordPressEditorProps) => {
  const [mode, setMode] = useState<"visual" | "code" | "preview">("visual");
  const [codeContent, setCodeContent] = useState(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({
        placeholder: "এখানে পোস্টের কন্টেন্ট লিখুন...",
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setCodeContent(html);
    },
  });

  // Sync content from outside
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setCodeContent(content);
    }
  }, [content, editor]);

  const handleCodeChange = useCallback(
    (value: string) => {
      setCodeContent(value);
      onChange(value);
    },
    [onChange]
  );

  const handleModeChange = (newMode: string) => {
    if (newMode === "visual" && mode === "code") {
      // Switching from code to visual - update editor
      editor?.commands.setContent(codeContent);
    } else if (newMode === "code" && mode === "visual") {
      // Switching from visual to code - update textarea
      setCodeContent(editor?.getHTML() || "");
    }
    setMode(newMode as "visual" | "code" | "preview");
  };

  const addLink = () => {
    const url = window.prompt("লিংক URL দিন:");
    if (url && editor) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt("ইমেজ URL দিন:");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={handleModeChange}>
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-2">
          <TabsList className="bg-transparent h-10 p-0 gap-0">
            <TabsTrigger
              value="visual"
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-b-none h-9 px-4 text-xs"
            >
              <Type className="w-3.5 h-3.5 mr-1.5" />
              ভিজ্যুয়াল
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-b-none h-9 px-4 text-xs"
            >
              <Code className="w-3.5 h-3.5 mr-1.5" />
              কোড
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-b-none h-9 px-4 text-xs"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              প্রিভিউ
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Visual Editor */}
        <TabsContent value="visual" className="m-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/20">
            {/* Text formatting */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              icon={Bold}
              title="Bold (Ctrl+B)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              icon={Italic}
              title="Italic (Ctrl+I)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              icon={UnderlineIcon}
              title="Underline (Ctrl+U)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              icon={Strikethrough}
              title="Strikethrough"
            />

            <ToolbarDivider />

            {/* Headings */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive("heading", { level: 1 })}
              icon={Heading1}
              title="Heading 1"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive("heading", { level: 2 })}
              icon={Heading2}
              title="Heading 2"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive("heading", { level: 3 })}
              icon={Heading3}
              title="Heading 3"
            />

            <ToolbarDivider />

            {/* Alignment */}
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              isActive={editor.isActive({ textAlign: "left" })}
              icon={AlignLeft}
              title="Align Left"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              isActive={editor.isActive({ textAlign: "center" })}
              icon={AlignCenter}
              title="Align Center"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              isActive={editor.isActive({ textAlign: "right" })}
              icon={AlignRight}
              title="Align Right"
            />

            <ToolbarDivider />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              icon={List}
              title="Bullet List"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              icon={ListOrdered}
              title="Ordered List"
            />

            <ToolbarDivider />

            {/* Block elements */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              icon={Quote}
              title="Blockquote"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive("codeBlock")}
              icon={Code}
              title="Code Block"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              icon={Minus}
              title="Horizontal Rule"
            />

            <ToolbarDivider />

            {/* Media */}
            <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} icon={LinkIcon} title="Insert Link" />
            <ToolbarButton onClick={addImage} icon={ImageIcon} title="Insert Image" />

            <ToolbarDivider />

            {/* Undo/Redo */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              icon={Undo}
              title="Undo (Ctrl+Z)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              icon={Redo}
              title="Redo (Ctrl+Shift+Z)"
            />
          </div>

          {/* Editor Content */}
          <EditorContent
            editor={editor}
            className="wordpress-editor-content min-h-[400px] max-h-[600px] overflow-y-auto p-4"
          />
        </TabsContent>

        {/* Code Editor */}
        <TabsContent value="code" className="m-0">
          <Textarea
            value={codeContent}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="min-h-[450px] font-mono text-sm border-0 rounded-none resize-none focus-visible:ring-0 bg-muted text-primary"
            placeholder="<p>HTML কোড এখানে লিখুন...</p>"
          />
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="m-0">
          <div
            className="wordpress-preview min-h-[450px] p-6 prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: mode === "preview" ? codeContent : (editor?.getHTML() || ""),
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WordPressEditor;
