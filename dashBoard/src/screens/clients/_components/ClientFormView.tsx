import { useState, type ComponentProps } from "react";
import {
  AutoComplete,
  Avatar,
  Button,
  Checkbox,
  Form,
  Input,
  message,
  Segmented,
  Select,
  Tabs,
  Upload,
} from "antd";
import {
  ArrowLeftOutlined,
  BankOutlined,
  CameraOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { isValidPhoneNumber } from "react-phone-number-input";
import { PhoneInput } from "@/components/reui/phone-input";
import { apiClient } from "@/lib/apiClient";
import ImgCrop from "antd-img-crop";
import { uploadImage } from "@/services/userService";
import { queryClient } from "@/lib/queryClient";
import type { Client, ClientStatus } from "@/types";
import type { AxiosError } from "axios";
import { ProjectsTab } from "./ProjectsTab";
import { CLIENT_SOURCES, CLIENT_STATUSES, initialsOf } from "./clients";

type ClientFormViewProps = {
  client?: Client | null;
  clients?: Client[];
  onBack: () => void;
};

const COUNTRIES = [
  "India", "United States", "United Kingdom", "United Arab Emirates", "Saudi Arabia", "Qatar",
  "Singapore", "Malaysia", "Australia", "New Zealand", "Canada", "Germany", "France", "Netherlands",
  "Sri Lanka", "Nepal", "Bangladesh",
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "(GMT+05:30) India — Mumbai, Kolkata" },
  { value: "Asia/Dubai", label: "(GMT+04:00) Dubai" },
  { value: "Asia/Riyadh", label: "(GMT+03:00) Riyadh" },
  { value: "Asia/Singapore", label: "(GMT+08:00) Singapore" },
  { value: "Asia/Kuala_Lumpur", label: "(GMT+08:00) Kuala Lumpur" },
  { value: "Asia/Colombo", label: "(GMT+05:30) Colombo" },
  { value: "Asia/Kathmandu", label: "(GMT+05:45) Kathmandu" },
  { value: "Asia/Dhaka", label: "(GMT+06:00) Dhaka" },
  { value: "Europe/London", label: "(GMT+00:00) London" },
  { value: "Europe/Berlin", label: "(GMT+01:00) Berlin, Paris, Amsterdam" },
  { value: "America/New_York", label: "(GMT-05:00) New York" },
  { value: "America/Chicago", label: "(GMT-06:00) Chicago" },
  { value: "America/Los_Angeles", label: "(GMT-08:00) Los Angeles" },
  { value: "America/Toronto", label: "(GMT-05:00) Toronto" },
  { value: "Australia/Sydney", label: "(GMT+10:00) Sydney" },
  { value: "Pacific/Auckland", label: "(GMT+12:00) Auckland" },
];

const SOURCES = Object.entries(CLIENT_SOURCES).map(([value, label]) => ({ value, label }));

const INDUSTRIES = [
  "IT & Software", "E-commerce", "Retail", "Healthcare", "Education", "Real Estate", "Construction",
  "Manufacturing", "Finance & Banking", "Insurance", "Hospitality", "Food & Beverage",
  "Media & Entertainment", "Logistics", "Consulting", "Legal", "Non-profit", "Government",
];

const CURRENCIES = [
  { value: "INR", label: "₹ INR — Indian Rupee" },
  { value: "USD", label: "$ USD — US Dollar" },
  { value: "EUR", label: "€ EUR — Euro" },
  { value: "GBP", label: "£ GBP — British Pound" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SGD", label: "S$ SGD — Singapore Dollar" },
  { value: "AUD", label: "A$ AUD — Australian Dollar" },
  { value: "CAD", label: "C$ CAD — Canadian Dollar" },
];

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "telegram", label: "Telegram" },
  { value: "phone_call", label: "Phone call" },
  { value: "in_person", label: "Meet in person" },
];

const LANGUAGES = [
  "English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Bengali", "Gujarati",
  "Punjabi", "Urdu", "Odia", "Arabic", "French", "German", "Spanish",
];

const toOptions = (values: string[]) => values.map((v) => ({ label: v, value: v }));

// Optional field, but when filled it must be a real number for the selected country.
const phoneRule = (label: string) => ({
  validator: (_: unknown, value?: string) =>
    !value || isValidPhoneNumber(value)
      ? Promise.resolve()
      : Promise.reject(new Error(`Enter a valid ${label}`)),
});

// Bridges antd Form.Item (value/onChange/error status) to the shadcn PhoneInput.
function PhoneField(props: ComponentProps<typeof PhoneInput>) {
  const { status } = Form.Item.useStatus();
  return (
    <PhoneInput
      variant="lg"
      defaultCountry="IN"
      placeholder="98765 43210"
      aria-invalid={status === "error"}
      {...props}
    />
  );
}

function StatusLabel({ value }: { value: ClientStatus }) {
  const status = CLIENT_STATUSES[value];
  if (!status) return null;
  return (
    <span className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  );
}

export function ClientFormView({ client, clients = [], onBack }: ClientFormViewProps) {
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(client?.avatar || null);
  const [activeTab, setActiveTab] = useState("basic");

  const isEditing = Boolean(client);

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const {
        rbId, referredBy, profileUrl, campaignName, enquiryPage, whatsappGroup, otherSourceDetails,
        whatsappSameAsPhone, ...rest
      } = values;
      const sourceDetails = {
        ...(rbId ? { rbId } : {}),
        ...(referredBy ? { referredBy } : {}),
        ...(profileUrl ? { profileUrl } : {}),
        ...(campaignName ? { campaignName } : {}),
        ...(enquiryPage ? { enquiryPage } : {}),
        ...(whatsappGroup ? { whatsappGroup } : {}),
        ...(otherSourceDetails ? { details: otherSourceDetails } : {}),
      };

      const payload = {
        ...rest,
        whatsapp: whatsappSameAsPhone ? rest.phone : rest.whatsapp,
        email: rest.email || undefined,
        state: rest.state || undefined,
        country: rest.country || undefined,
        sourceDetails,
        avatar: avatarUrl ?? undefined,
      };
      if (isEditing && client) {
        const res = await apiClient.put(`/clients/${client.publicId}`, payload);
        return res.data;
      }
      const res = await apiClient.post("/clients", payload);
      return res.data;
    },
    onSuccess: () => {
      message.success(isEditing ? "Client updated successfully" : "Client created successfully");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      onBack();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || "Failed to save client");
    },
  });

  const handleFinish = (values: Record<string, unknown>) => {
    saveMutation.mutate(values);
  };

  const fieldTabs: Record<string, string> = {
    name: "basic", phone: "basic", email: "basic", city: "basic", source: "basic",
    companyName: "company", preferredChannels: "company",
  };

  const handleFinishFailed = ({ errorFields }: { errorFields: { name: (string | number)[] }[] }) => {
    const firstField = String(errorFields[0]?.name?.[0] ?? "");
    const tab = fieldTabs[firstField];
    if (tab) setActiveTab(tab);
  };

  const clientType = (Form.useWatch("clientType", form) as string | undefined) ?? "individual";
  const name = Form.useWatch("name", form) as string | undefined;
  const companyName = Form.useWatch("companyName", form) as string | undefined;
  const phone = Form.useWatch("phone", form) as string | undefined;
  const whatsappSameAsPhone = Form.useWatch("whatsappSameAsPhone", form) as boolean | undefined;
  const source = Form.useWatch("source", form) as string | undefined;

  const isCompany = clientType === "company";
  const displayName = name || (isEditing && client?.name ? client.name : "New Client");
  const initials = initialsOf(displayName);
  const subtitle = isCompany ? companyName || "Company name" : "Individual";

  const summaryRows = [
    { label: "Total invoices", value: "0", tone: "text-amber-600" },
    { label: "Paid invoices", value: "0", tone: "text-emerald-600" },
    { label: "Outstanding", value: "₹0", tone: "text-muted-foreground" },
  ];

  const referralOptions = clients
    .filter((c) => c.id !== client?.id)
    .map((c) => ({ value: c.name, label: c.name }));

  const renderSourceDetail = () => {
    switch (source) {
      case "rb_pranam":
        return (
          <Form.Item name="rbId" label="RB ID (optional)">
            <Input size="large" placeholder="RB-12345" />
          </Form.Item>
        );
      case "connection":
        return (
          <Form.Item name="referredBy" label="Referred by">
            <AutoComplete
              size="large"
              options={referralOptions}
              placeholder="Search existing clients or type a name"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        );
      case "linkedin":
      case "instagram":
        return (
          <Form.Item name="profileUrl" label="Profile URL (optional)">
            <Input
              size="large"
              placeholder={source === "linkedin" ? "https://linkedin.com/in/…" : "https://instagram.com/…"}
            />
          </Form.Item>
        );
      case "meta_ads":
      case "google_ads":
        return (
          <Form.Item name="campaignName" label="Campaign name (optional)">
            <Input size="large" placeholder="Diwali offer 2026" />
          </Form.Item>
        );
      case "website":
        return (
          <Form.Item name="enquiryPage" label="Page or form (optional)">
            <Input size="large" placeholder="Contact us page" />
          </Form.Item>
        );
      case "whatsapp_group":
        return (
          <Form.Item name="whatsappGroup" label="Group name">
            <Input size="large" placeholder="Chennai Startups" />
          </Form.Item>
        );
      case "other":
        return (
          <Form.Item name="otherSourceDetails" label="Details">
            <Input size="large" placeholder="How did they find us?" />
          </Form.Item>
        );
      default:
        return null;
    }
  };

  const basicDetails = (
    <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
      <Form.Item name="clientType" label="Client Type" className="md:col-span-2">
        <Segmented
          size="large"
          options={[
            { value: "individual", label: "Individual", icon: <UserOutlined /> },
            { value: "company", label: "Company", icon: <BankOutlined /> },
          ]}
        />
      </Form.Item>

      <Form.Item
        name="name"
        label={isCompany ? "Contact Person Name" : "Full Name"}
        className="md:col-span-2"
        rules={[{ required: true, message: "Please enter the full name" }]}
      >
        <Input size="large" placeholder="John Doe" />
      </Form.Item>

      <Form.Item
        name="phone"
        label="Phone Number"
        rules={[{ required: true, message: "Please enter a phone number" }, phoneRule("phone number")]}
        validateDebounce={500}
      >
        <PhoneField />
      </Form.Item>

      <Form.Item label="WhatsApp Number">
        {whatsappSameAsPhone ? (
          <PhoneField value={phone} disabled placeholder="Same as phone number" />
        ) : (
          <Form.Item
            name="whatsapp"
            noStyle
            rules={[phoneRule("WhatsApp number")]}
            validateDebounce={500}
          >
            <PhoneField />
          </Form.Item>
        )}
        <Form.Item name="whatsappSameAsPhone" valuePropName="checked" noStyle>
          <Checkbox className="mt-2 text-xs">Same as phone number</Checkbox>
        </Form.Item>
      </Form.Item>

      <Form.Item
        name="email"
        label="Email Address"
        className="md:col-span-2"
        rules={[{ type: "email", message: "Enter a valid email address" }]}
      >
        <Input size="large" placeholder="john@company.com" />
      </Form.Item>

      <Form.Item
        name="city"
        label="City"
        rules={[{ required: true, message: "Please enter the city" }]}
      >
        <Input size="large" placeholder="Chennai" />
      </Form.Item>
      <Form.Item name="state" label="State">
        <Input size="large" placeholder="Tamil Nadu" />
      </Form.Item>
      <Form.Item name="country" label="Country">
        <Select size="large" showSearch placeholder="Select country" options={toOptions(COUNTRIES)} />
      </Form.Item>
      <Form.Item name="timezone" label="Timezone">
        <Select size="large" showSearch optionFilterProp="label" options={TIMEZONES} />
      </Form.Item>

      <Form.Item
        name="source"
        label="Source"
        rules={[{ required: true, message: "Please select a source" }]}
      >
        <Select size="large" placeholder="Where did they come from?" options={SOURCES} />
      </Form.Item>
      {renderSourceDetail()}
    </div>
  );

  const companyDetails = (
    <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
      <Form.Item
        name="companyName"
        label="Company Name"
        className="md:col-span-2"
        rules={[{ required: true, message: "Please enter the company name" }]}
      >
        <Input size="large" placeholder="Acme Pvt Ltd" />
      </Form.Item>
      <Form.Item name="industry" label="Industry">
        <AutoComplete
          size="large"
          options={toOptions(INDUSTRIES)}
          placeholder="Select or type an industry"
          filterOption={(input, option) =>
            (option?.value ?? "").toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>
      <Form.Item name="website" label="Website">
        <Input size="large" placeholder="https://acme.com" />
      </Form.Item>
      <Form.Item name="taxId" label="GSTIN / Tax ID">
        <Input size="large" placeholder="33ABCDE1234F1Z5" />
      </Form.Item>
      <Form.Item name="currency" label="Preferred Currency">
        <Select size="large" showSearch optionFilterProp="label" options={CURRENCIES} />
      </Form.Item>
      <Form.Item
        name="preferredChannels"
        label="Preferred Communication"
        rules={[{ required: true, message: "Please select at least one communication channel" }]}
      >
        <Select
          size="large"
          mode="multiple"
          placeholder="Select one or more"
          options={CHANNELS}
        />
      </Form.Item>
      <Form.Item name="language" label="Language">
        <Select size="large" showSearch placeholder="Select language" options={toOptions(LANGUAGES)} />
      </Form.Item>
    </div>
  );

  const tabItems = [
    { key: "basic", label: "Basic Details", children: basicDetails, forceRender: true },
    { key: "company", label: "Company Details", children: companyDetails, forceRender: true },
    { key: "projects", label: "Projects", children: <ProjectsTab clientId={client?.publicId} />, forceRender: true },
  ];

  const clientData = (client ?? {}) as Record<string, unknown>;
  const savedSourceDetails = (clientData.sourceDetails ?? {}) as Record<string, string>;

  const initialValues = {
    status: "lead",
    clientType: "individual",
    country: "India",
    timezone: "Asia/Kolkata",
    currency: "INR",
    whatsappSameAsPhone: !clientData.whatsapp || clientData.whatsapp === clientData.phone,
    ...clientData,
    rbId: savedSourceDetails.rbId,
    referredBy: savedSourceDetails.referredBy,
    profileUrl: savedSourceDetails.profileUrl,
    campaignName: savedSourceDetails.campaignName,
    enquiryPage: savedSourceDetails.enquiryPage,
    whatsappGroup: savedSourceDetails.whatsappGroup,
    otherSourceDetails: savedSourceDetails.details,
  };

  return (
    <div className="min-h-screen w-full bg-muted/40">
      {/* Brand banner */}
      <div className="relative h-44 overflow-hidden bg-brand-blue">
        <div className="pointer-events-none absolute -left-16 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-24 -top-10 h-56 w-56 rotate-45 bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-3 px-6 pt-6 text-white">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
            aria-label="Back to clients"
          >
            <ArrowLeftOutlined />
          </button>
          <div>
            <p className="text-xs text-white/70">Clients</p>
            <h1 className="text-lg font-semibold leading-tight">
              {isEditing ? "Edit Client" : "Add New Client"}
            </h1>
          </div>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={initialValues}
        onFinish={handleFinish}
        onFinishFailed={handleFinishFailed}
      >
        <div className="relative -mt-20 grid grid-cols-1 gap-6 px-4 pb-10 md:px-6 lg:grid-cols-[300px_1fr]">
          {/* Profile summary card */}
          <aside className="h-fit overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
              <div className="relative">
                <Avatar
                  size={112}
                  src={avatarUrl ?? undefined}
                  icon={!initials ? <UserOutlined /> : undefined}
                  className="bg-brand-blue/10! text-3xl! font-semibold! text-brand-blue!"
                >
                  {initials}
                </Avatar>
                <ImgCrop rotationSlider cropShape="round" modalTitle="Crop photo" showGrid>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      uploadImage(file)
                        .then(setAvatarUrl)
                        .catch(() => message.error("Could not upload that image"));
                      return false;
                    }}
                  >
                    <button
                      type="button"
                      className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-brand-blue text-white shadow"
                      aria-label="Upload photo"
                    >
                      <CameraOutlined />
                    </button>
                  </Upload>
                </ImgCrop>
              </div>
              <h2 className="mt-4 text-base font-semibold text-foreground">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{subtitle}</p>

              <Form.Item name="status" label="Status" className="mb-0! mt-5 w-full text-left">
                <Select
                  size="large"
                  options={Object.entries(CLIENT_STATUSES).map(([value, s]) => ({ value, label: s.label }))}
                  labelRender={({ value }) => <StatusLabel value={value as ClientStatus} />}
                  optionRender={(option) => <StatusLabel value={option.value as ClientStatus} />}
                />
              </Form.Item>
            </div>

            <div className="border-t border-border">
              {summaryRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between border-b border-border px-6 py-3.5 text-sm last:border-b-0"
                >
                  <span className="text-foreground">{row.label}</span>
                  <span className={`font-semibold ${row.tone}`}>{row.value}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-6">
              <Button block size="large" onClick={onBack}>
                Back to Clients
              </Button>
            </div>
          </aside>

          {/* Details card */}
          <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              className="[&_.ant-tabs-content-holder]:px-6 [&_.ant-tabs-content-holder]:pt-4 [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:px-6 [&_.ant-tabs-tab]:py-5"
            />

            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-5">
              <Button size="large" onClick={onBack}>
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={saveMutation.isPending}
              >
                {isEditing ? "Update Client" : "Create Client"}
              </Button>
            </div>
          </section>
        </div>
      </Form>
    </div>
  );
}
