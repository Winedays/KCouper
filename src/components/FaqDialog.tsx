import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FAQ_ITEMS,
  FAQ_CATEGORY_LABELS,
  FAQ_CATEGORY_ORDER,
} from "@/data/faq";

type FaqDialogProps = {
  variant?: "default" | "menu-item";
};

/**
 * FAQ dialog component with accordion-style Q&A grouped by category
 */
const FaqDialog = ({ variant = "default" }: FaqDialogProps) => {
  const [open, setOpen] = useState(false);

  const trigger =
    variant === "menu-item" ? (
      <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted">
        <HelpCircle className="h-4 w-4" />
        <span>常見問題</span>
      </button>
    ) : (
      <button
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        aria-label="常見問題"
        title="常見問題"
      >
        <HelpCircle className="h-4 w-4" />
        <span>FAQ</span>
      </button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg sm:max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>常見問題</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overscroll-contain -mx-6 px-6">
          <div className="space-y-6 pb-4">
            {FAQ_CATEGORY_ORDER.map((category) => {
              const items = FAQ_ITEMS.filter((f) => f.category === category);
              if (items.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    {FAQ_CATEGORY_LABELS[category]}
                  </h3>
                  <Accordion type="multiple">
                    {items.map((item) => (
                      <AccordionItem key={item.id} value={item.id}>
                        <AccordionTrigger className="text-left text-sm">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {item.answer}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FaqDialog;
