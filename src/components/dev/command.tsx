"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/dev/dialog"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-3xl bg-white text-slate-900 border-0 outline-none",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent
        hideClose
        variant="bare"
        className="overflow-hidden p-0 rounded-3xl border-2 border-indigo-200/80 bg-white shadow-2xl max-w-2xl w-[95vw] sm:w-[620px] mx-auto outline-none"
        style={{
          boxShadow:
            "0 25px 60px -15px rgba(79, 70, 229, 0.22), 0 0 0 1px rgba(99, 102, 241, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.95)",
        }}
      >
        <Command className="bg-transparent text-slate-900">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className="flex items-center px-4 py-3 bg-transparent border-b border-indigo-100/60"
    cmdk-input-wrapper=""
  >
    <Search className="h-5 w-5 shrink-0 text-indigo-500 mr-3" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400",
        "border-0 border-none outline-none ring-0 shadow-none",
        "focus:border-0 focus:border-none focus:outline-none focus:ring-0 focus:shadow-none",
        "focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none",
        "[border:none!important] [outline:none!important] [box-shadow:none!important]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{ border: "none", outline: "none", boxShadow: "none" }}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[420px] overflow-y-auto overflow-x-hidden p-2.5 space-y-1.5 scrollbar-thin", className)}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-8 text-center text-xs font-medium text-slate-500"
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-slate-900 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-extrabold [&_[cmdk-group-heading]]:text-indigo-900/60 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider",
      className
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1.5 h-px bg-indigo-100/60", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer gap-2.5 select-none items-center rounded-2xl px-3 py-2 text-xs font-medium text-slate-700 outline-none",
      "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 transition-all duration-150",
      "data-[selected='true']:bg-gradient-to-r data-[selected='true']:from-indigo-50 data-[selected='true']:via-purple-50/70 data-[selected='true']:to-indigo-50/50",
      "data-[selected='true']:text-indigo-950 data-[selected='true']:border data-[selected='true']:border-indigo-200/70 data-[selected='true']:shadow-2xs",
      className
    )}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
