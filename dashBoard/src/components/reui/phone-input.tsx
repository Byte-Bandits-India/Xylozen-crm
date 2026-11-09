// Adapted from reui's phone-input (@reui/c-phone-input-1) for this project's
// Radix-based shadcn components: the country picker uses Popover instead of the
// base-ui Combobox the original depends on.
import { createContext, useContext, useMemo, useState } from "react"
import * as BasePhoneInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"
import { CheckIcon, ChevronDownIcon, GlobeIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type PhoneInputSize = "sm" | "default" | "lg"

const PhoneInputContext = createContext<{
  variant: PhoneInputSize
  invalid: boolean
  popupClassName?: string
}>({
  variant: "default",
  invalid: false,
  popupClassName: undefined,
})

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<
    BasePhoneInput.Props<typeof BasePhoneInput.default>,
    "onChange" | "variant" | "popupClassName"
  > & {
    onChange?: (value: BasePhoneInput.Value) => void
    variant?: PhoneInputSize
    popupClassName?: string
  }

function PhoneInput({
  className,
  variant,
  popupClassName,
  onChange,
  value,
  ...props
}: PhoneInputProps) {
  const invalid = Boolean(props["aria-invalid"])

  return (
    <PhoneInputContext.Provider
      value={{ variant: variant || "default", invalid, popupClassName }}
    >
      <BasePhoneInput.default
        className={cn("flex", className)}
        flagComponent={FlagComponent}
        countrySelectComponent={CountrySelect}
        inputComponent={InputComponent}
        smartCaret={false}
        value={value || undefined}
        onChange={(value) => onChange?.(value || ("" as BasePhoneInput.Value))}
        {...props}
      />
    </PhoneInputContext.Provider>
  )
}

function InputComponent({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const { variant } = useContext(PhoneInputContext)

  return (
    <Input
      className={cn(
        "rounded-s-none focus:z-1",
        variant === "sm" && "h-8",
        variant === "lg" && "h-10",
        className
      )}
      {...props}
    />
  )
}

type CountryEntry = { label: string; value: BasePhoneInput.Country | undefined }

type CountrySelectProps = {
  disabled?: boolean
  value: BasePhoneInput.Country
  options: CountryEntry[]
  onChange: (country: BasePhoneInput.Country) => void
}

function CountrySelect({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountrySelectProps) {
  const { variant, invalid, popupClassName } = useContext(PhoneInputContext)
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // The library's "International" option has no country code, so skip it.
  const filteredCountries = useMemo(() => {
    const query = searchValue.toLowerCase()
    return countryList.filter(
      ({ value, label }) => value && label.toLowerCase().includes(query)
    )
  }, [countryList, searchValue])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearchValue("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={variant}
          className={cn(
            "flex gap-1 rounded-e-none border-e-0 px-2.5 hover:bg-transparent focus:z-10",
            invalid && "border-destructive"
          )}
          disabled={disabled}
          aria-label="Select country"
        >
          <FlagComponent country={selectedCountry} countryName={selectedCountry} />
          <ChevronDownIcon className="size-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-72 p-0", popupClassName)}>
        <div className="border-b border-border p-2">
          <Input
            autoFocus
            placeholder="Search country"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-8 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-64 overflow-y-auto overscroll-contain p-1">
          {filteredCountries.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">No country found.</p>
          ) : (
            filteredCountries.map((item) =>
              item.value ? (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onChange(item.value as BasePhoneInput.Country)
                    setOpen(false)
                    setSearchValue("")
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <FlagComponent country={item.value} countryName={item.label} />
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className="text-foreground/50">
                    {`+${BasePhoneInput.getCountryCallingCode(item.value)}`}
                  </span>
                  {item.value === selectedCountry && <CheckIcon className="size-4" />}
                </button>
              ) : null
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function FlagComponent({ country, countryName }: BasePhoneInput.FlagProps) {
  const Flag = flags[country]

  return (
    <span className="flex h-4 w-5 items-center justify-center overflow-hidden rounded-[3px] [&_svg:not([class*='size-'])]:size-full">
      {Flag ? <Flag title={countryName} /> : <GlobeIcon className="size-4 opacity-60" />}
    </span>
  )
}

export { PhoneInput }
