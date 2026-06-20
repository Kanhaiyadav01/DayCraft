import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ open, onOpenChange, title, description, children, footer, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[1px]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: 20, rotate: -2, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, rotate: -0.6, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className={cn(
                  "fixed left-1/2 top-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2",
                  "paper-card p-6",
                  className,
                )}
              >
                <span
                  aria-hidden
                  className="tape-strip absolute -top-4 left-12 h-5 w-24 rotate-[-4deg]"
                />
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    {title && (
                      <Dialog.Title className="font-hand text-3xl leading-tight">{title}</Dialog.Title>
                    )}
                    {description && (
                      <Dialog.Description className="mt-1 text-sm text-ink-soft">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" aria-label="Close">
                      <X className="h-5 w-5" />
                    </Button>
                  </Dialog.Close>
                </div>
                <div className="font-body text-base">{children}</div>
                {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
