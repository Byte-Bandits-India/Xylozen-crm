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
import { subDays, isBefore, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

export interface DatePickerWithRangeProps {
    date?: DateRange | undefined;
    onDateChange?: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({
    date: externalDate,
    onDateChange,
}: DatePickerWithRangeProps = {}) {
    const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(() => {
        const today = new Date();
        return {
            from: subDays(today, 30),
            to: today,
        };
    });

    const isControlled = externalDate !== undefined;
    const date = isControlled ? externalDate : internalDate;

    const handleSelect = (newRange: DateRange | undefined, selectedDay?: Date) => {
        const day = selectedDay || newRange?.to || newRange?.from;

        let nextRange: DateRange | undefined = newRange;

        // If both from and to were already selected, start a fresh range with the clicked day
        if (date?.from && date?.to && day) {
            nextRange = { from: day, to: undefined };
        } else if (date?.from && !date?.to && day) {
            if (isBefore(day, date.from)) {
                nextRange = { from: day, to: date.from };
            } else {
                nextRange = { from: date.from, to: day };
            }
        }

        if (!isControlled) {
            setInternalDate(nextRange);
        }
        onDateChange?.(nextRange);
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
                            className="[&_.rdp-day_selected]:bg-blue-500 [&_.rdp-day_selected]:text-white [&_.rdp-day]:focus-visible:ring-blue-500 [&_[data-range-start=true]]:bg-blue-600 [&_[data-range-start=true]]:text-white [&_[data-range-end=true]]:bg-blue-600 [&_[data-range-end=true]]:text-white [&_[data-range-middle=true]]:bg-blue-200 [&_[data-range-middle=true]]:text-blue-900"
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </Field>
    );
}

export default DatePickerWithRange;
