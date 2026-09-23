"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field } from "@/components/ui/field"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { addDays, addMonths, subMonths, isAfter, isBefore, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

export function DatePickerWithRange() {
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), 0, 20),
        to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
    })

    const handleSelect = (newDate: DateRange | undefined) => {
        // Enforce the 1 month restriction programmatically
        if (newDate?.from && newDate?.to) {
            if (isAfter(newDate.to, addMonths(newDate.from, 1))) {
                newDate.to = addMonths(newDate.from, 1);
            }
        }
        setDate(newDate);
    };

    return (
        <Field className="mx-auto w-fit">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date-picker-range"
                        className="justify-start px-2.5 font-normal border-blue-500 text-blue-700 hover:bg-blue-50 focus:ring-blue-500"
                    >
                        <CalendarIcon />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-2 rounded-lg bg-blue-50">
                        <Calendar
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={handleSelect}
                            numberOfMonths={2}
                            disabled={
                                date?.from && !date?.to
                                    ? (day) =>
                                          isAfter(day, addMonths(date.from as Date, 1)) ||
                                          isBefore(day, subMonths(date.from as Date, 1))
                                    : undefined
                            }
                            className="[&_.rdp-day_selected]:bg-blue-500 [&_.rdp-day_selected]:text-white [&_.rdp-day]:focus-visible:ring-blue-500"
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </Field>
    )
}
