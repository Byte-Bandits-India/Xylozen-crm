import { useEffect, useRef, useState } from "react";
import { Avatar, Button, ConfigProvider, message, Form, Input, InputNumber, Select, Upload } from "antd";
import { PictureOutlined } from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import { uploadImage } from "@/services/userService";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/reui/badge";
import {
  PROJECT_STATUSES,
  initialsOf,
  memberName,
  type ClientProject,
  type ProjectMember,
} from "./projects";

type ProjectFormValues = Pick<
  ClientProject,
  "name" | "companyName" | "status" | "summaryTitle" | "summaryText" | "memberIds" | "progress" | "payment" | "startDate"
>;

type ProjectDrawerProps = {
  open: boolean;
  project: ClientProject | null;
  members: ProjectMember[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Omit<ClientProject, "id">, existingId?: string) => void;
  saving?: boolean;
};

export function ProjectDrawer({ open, project, members, onOpenChange, onSubmit, saving }: ProjectDrawerProps) {
  // Separate form from the client form: the drawer is portalled but would
  // otherwise still inherit the parent Form context.
  const [form] = Form.useForm<ProjectFormValues>();
  const [logoUrl, setLogoUrl] = useState<string>();
  // The drawer is modal, so antd dropdowns must render inside it to stay clickable.
  const popupContainerRef = useRef<HTMLDivElement>(null);
  const isEditing = Boolean(project);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.resetFields();
      setLogoUrl(undefined);
    }
    onOpenChange(next);
  };

  const handleFinish = (values: ProjectFormValues) => {
    onSubmit(
      {
        ...values,
        memberIds: values.memberIds ?? [],
        logoUrl,
        startDate: values.startDate ?? "",
        progress: Number(values.progress ?? 0),
        payment: Number(values.payment ?? 0),
      },
      project?.id,
    );
  };

  const initialValues = project
    ? { ...project, startDate: project.startDate?.slice(0, 10) }
    : { status: "backlog", memberIds: [], progress: 0, payment: 0 };

  useEffect(() => {
    setLogoUrl(project?.logoUrl);
    if (!open) form.resetFields();
  }, [project, open, form]);

  const memberOptions = members.map((m) => ({ value: m.publicId, label: memberName(m) }));

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-xl">
        {project ? (
          <DrawerHeader className="flex-row items-center gap-3 px-6 py-5">
            <Avatar shape="square" size={44} src={project.logoUrl} className="shrink-0 rounded-lg! bg-brand-blue/10! font-semibold! text-brand-blue!">
              {initialsOf(project.name)}
            </Avatar>
            <div className="min-w-0 flex-1">
              <DrawerTitle className="truncate text-lg">{project.name}</DrawerTitle>
              <DrawerDescription className="truncate">{project.companyName || "No company"}</DrawerDescription>
            </div>
            <Badge variant={PROJECT_STATUSES[project.status].variant}>
              {PROJECT_STATUSES[project.status].label}
            </Badge>
          </DrawerHeader>
        ) : (
          <DrawerHeader className="px-6 py-5">
            <DrawerTitle className="text-lg">New Project</DrawerTitle>
            <DrawerDescription>Add a project for this client.</DrawerDescription>
          </DrawerHeader>
        )}

        <div ref={popupContainerRef} className="relative flex min-h-0 flex-1 flex-col">
          {(
            <ConfigProvider getPopupContainer={() => popupContainerRef.current ?? document.body}>
              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                initialValues={initialValues}
                key={project?.id ?? "new"}
                onFinish={handleFinish}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <div className="mb-6 flex items-center gap-4">
                    <Avatar
                      shape="square"
                      size={64}
                      src={logoUrl}
                      icon={<PictureOutlined />}
                      className="shrink-0 rounded-xl! bg-muted! text-muted-foreground!"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Project logo</p>
                      <p className="mb-2 text-xs text-muted-foreground">PNG, JPG or SVG, square works best.</p>
                      <div className="flex gap-2">
                        <ImgCrop rotationSlider modalTitle="Crop logo" showGrid>
                          <Upload
                            accept="image/*"
                            showUploadList={false}
                            beforeUpload={(file) => {
                              uploadImage(file)
                                .then(setLogoUrl)
                                .catch(() => message.error("Could not upload that image"));
                              return false;
                            }}
                          >
                            <Button size="small">{logoUrl ? "Change" : "Upload"}</Button>
                          </Upload>
                        </ImgCrop>
                        {logoUrl && (
                          <Button size="small" type="text" danger onClick={() => setLogoUrl(undefined)}>
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <Form.Item
                      name="name"
                      label="Project Name"
                      rules={[{ required: true, message: "Enter a project name" }]}
                    >
                      <Input size="large" placeholder="Website redesign" />
                    </Form.Item>
                    <Form.Item name="companyName" label="Company Name">
                      <Input size="large" placeholder="Acme Pvt Ltd" />
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <Form.Item name="progress" label="Progress (%)">
                      <InputNumber size="large" min={0} max={100} className="w-full!" />
                    </Form.Item>
                    <Form.Item name="payment" label="Project Value (INR)">
                      <InputNumber size="large" min={0} className="w-full!" prefix="₹" />
                    </Form.Item>
                  </div>

                  <Form.Item name="startDate" label="Start Date">
                    <Input size="large" type="date" />
                  </Form.Item>

                  <Form.Item name="status" label="Status">
                    <Select
                      size="large"
                      options={Object.entries(PROJECT_STATUSES).map(([value, s]) => ({ value, label: s.label }))}
                    />
                  </Form.Item>

                  <Form.Item name="summaryTitle" label="Summary Heading">
                    <Input size="large" placeholder="A need for upgrades" />
                  </Form.Item>
                  <Form.Item name="summaryText" label="Summary">
                    <Input.TextArea
                      rows={3}
                      maxLength={300}
                      showCount
                      placeholder="A short description of what this project is about"
                    />
                  </Form.Item>

                  <Form.Item name="memberIds" label="Members">
                    <Select
                      size="large"
                      mode="multiple"
                      placeholder="Select team members"
                      optionFilterProp="label"
                      options={memberOptions}
                      optionRender={(option) => (
                        <span className="flex items-center gap-2">
                          <Avatar size={22} className="bg-brand-blue/10! text-[10px]! text-brand-blue!">
                            {initialsOf(String(option.label))}
                          </Avatar>
                          {option.label}
                        </span>
                      )}
                      notFoundContent={<span className="text-xs text-muted-foreground">No users found</span>}
                    />
                  </Form.Item>
                </div>

                <DrawerFooter className="flex-row justify-end gap-3 px-6 py-4">
                  <DrawerClose asChild>
                    <Button size="large">Cancel</Button>
                  </DrawerClose>
                  <Button type="primary" size="large" htmlType="submit" loading={saving}>
                    {isEditing ? "Save Changes" : "Create Project"}
                  </Button>
                </DrawerFooter>
              </Form>
            </ConfigProvider>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
