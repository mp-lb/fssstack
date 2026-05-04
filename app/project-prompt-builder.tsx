"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Check,
  Copy,
  ChevronDown,
  FlaskConical,
  GitCommit,
  Info,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  defaultProjectPromptConfig,
  normalizeProjectPromptConfig,
  projectPromptSchema,
  toSlug,
  type ProjectPromptConfig,
} from "./project-schema";

type FrontendType = ProjectPromptConfig["frontendClients"][number]["type"];

const frontendTypes: { label: string; value: FrontendType }[] = [
  { label: "React Vite", value: "react-vite" },
  { label: "React Next.js", value: "react-nextjs" },
];

const frontendTypeLabel = (value: FrontendType) =>
  frontendTypes.find((type) => type.value === value)?.label ?? value;

const includePrerequisitesStorageKey = "fssstack-start.include-prerequisites";
const servicesHelpOpenStorageKey = "fssstack-start.services-help-open";

const projectFieldHelp = {
  name: "Used for generated README content and app titles.",
  slug: "Used as the project slug in template placeholders and package naming.",
  emoji: "Rendered into readme/favicon assets.",
  packagePrefix:
    "Combined with the project slug and app slugs to form workspace package names.",
  gitUrl: "Optional repository metadata included in the setup prompt.",
};

const buildPrompt = (
  config: ProjectPromptConfig,
  includePrerequisites: boolean,
) => `${includePrerequisites ? `Before starting, make sure the \`git\`, \`docker\`, \`node\`, \`pm2\`, and \`zapper\` commands are available. Install anything missing before continuing. On macOS, Homebrew is a reasonable default for Git, Docker, and Node; install PM2 and Zapper with \`npm install --global pm2 @mp-lb/zapper\`.

` : ""}Start setup:

1. Start in an empty git repository.
2. Run \`mkdir .fssstack; curl -fsSL https://github.com/mp-lb/fssstack/archive/refs/heads/main.tar.gz | tar -xz --strip-components=1 -C .fssstack\`.
3. Follow the instructions in \`.fssstack/SETUP_PROCESS.md\`.

Use these values:
name: ${config.name}
slug: ${config.slug}
emoji: ${config.emoji}
${config.gitUrl ? `gitUrl: ${config.gitUrl}\n` : ""}packagePrefix: ${config.packagePrefix}
backendServices: ${config.backendServices.join(", ")}
frontendClients: ${config.frontendClients
  .map((client) => `${client.slug} (${client.type})`)
  .join(", ")}`;

const fieldId = (path: PropertyKey[]) =>
  path
    .filter((part): part is string | number => typeof part !== "symbol")
    .join(".");

export default function ProjectPromptBuilder() {
  const [config, setConfig] = useState<ProjectPromptConfig>(
    defaultProjectPromptConfig,
  );
  const [includePrerequisites, setIncludePrerequisites] =
    useLocalStorageBoolean(includePrerequisitesStorageKey, true);
  const [copied, setCopied] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [servicesHelpOpen, setServicesHelpOpen] = useLocalStorageBoolean(
    servicesHelpOpenStorageKey,
    false,
  );

  const normalizedConfig = useMemo(
    () => normalizeProjectPromptConfig(config),
    [config],
  );
  const result = useMemo(
    () => projectPromptSchema.safeParse(normalizedConfig),
    [normalizedConfig],
  );
  const generatedPrompt = result.success
    ? buildPrompt(result.data, includePrerequisites)
    : "";
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);
  const prompt = customPrompt ?? generatedPrompt;
  const isPromptDirty =
    customPrompt !== null && customPrompt !== generatedPrompt;
  const issues = result.success ? [] : result.error.issues;
  const rawValues = JSON.stringify(normalizedConfig, null, 2);
  const hasEmptyServiceField =
    config.backendServices.some((service) => service.trim() === "") ||
    config.frontendClients.some((client) => client.slug.trim() === "");
  const serviceSlugs = [
    ...config.backendServices.map(toSlug),
    ...config.frontendClients.map((client) => toSlug(client.slug)),
  ].filter((slug) => slug !== "");
  const duplicateServiceSlugs = new Set(
    serviceSlugs.filter(
      (slug, index) => serviceSlugs.indexOf(slug) !== index,
    ),
  );

  const errorFor = (path: (string | number)[]) =>
    issues.find((issue) => fieldId(issue.path) === fieldId(path))?.message;
  const duplicateServiceErrorFor = (slug: string) =>
    duplicateServiceSlugs.has(toSlug(slug))
      ? "Service and client slugs must be unique."
      : undefined;

  const updateConfig = (
    nextConfig:
      | ProjectPromptConfig
      | ((current: ProjectPromptConfig) => ProjectPromptConfig),
  ) => {
    if (
      isPromptDirty &&
      !window.confirm(
        "Changing inputs will reset your customized prompt. Continue?",
      )
    ) {
      return;
    }

    setCustomPrompt(null);
    setConfig(nextConfig);
  };

  const updateGeneratedSetting = (update: () => void) => {
    if (
      isPromptDirty &&
      !window.confirm(
        "Changing inputs will reset your customized prompt. Continue?",
      )
    ) {
      return;
    }

    setCustomPrompt(null);
    update();
  };

  const updateIncludePrerequisites = (value: boolean) => {
    updateGeneratedSetting(() => {
      setIncludePrerequisites(value);
    });
  };

  const setValue = <Key extends keyof ProjectPromptConfig>(
    key: Key,
    value: ProjectPromptConfig[Key],
  ) => {
    updateConfig((current) => ({ ...current, [key]: value }));
  };

  const updateName = (name: string) => {
    updateConfig((current) => {
      const shouldSyncSlug = current.slug === toSlug(current.name);

      return {
        ...current,
        name,
        slug: shouldSyncSlug ? toSlug(name) : current.slug,
      };
    });
  };

  const copyPrompt = async () => {
    if (!prompt) {
      return;
    }

    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-5 lg:px-6">
        <header className="flex flex-col gap-3 border-b pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-normal sm:text-3xl">
              <span aria-hidden="true">🧰</span>
              Fssstack Start
            </h1>
          </div>

          <div className="flex flex-col items-start gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
              onClick={() => setAboutOpen(true)}
            >
              <Info className="size-4" aria-hidden="true" />
              What is this?
            </button>
            <a
              href="https://github.com/mp-lb/fssstack"
              className="inline-flex items-center gap-1.5 text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
            >
              <GitCommit className="size-4" aria-hidden="true" />
              GitHub Repo
            </a>
            <a
              href="https://www.mp-lb.dev/"
              className="inline-flex items-center gap-1.5 text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
            >
              <FlaskConical className="size-4" aria-hidden="true" />
              MAP Lab Home
            </a>
          </div>
        </header>

        {aboutOpen && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm"
            role="presentation"
            onClick={() => setAboutOpen(false)}
          >
            <Card
              role="dialog"
              aria-modal="true"
              aria-labelledby="about-fssstack-title"
              className="max-h-[calc(100svh-2rem)] w-full max-w-2xl overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <CardHeader className="border-b">
                <CardTitle id="about-fssstack-title">
                  What is Fssstack?
                </CardTitle>
                <CardAction>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close"
                    onClick={() => setAboutOpen(false)}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                <AboutFssstack />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid items-stretch gap-3 lg:grid-cols-2">
          <Card size="sm" className="h-full">
            <CardHeader className="border-b">
              <CardTitle>Project info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={(event) => event.preventDefault()}
              >
                <TextField
                  label="Name"
                  help={projectFieldHelp.name}
                  value={config.name}
                  error={errorFor(["name"])}
                  onChange={updateName}
                />
                <TextField
                  label="Slug"
                  help={projectFieldHelp.slug}
                  value={config.slug}
                  error={errorFor(["slug"])}
                  onChange={(value) => setValue("slug", toSlug(value))}
                />
                <TextField
                  label="Emoji"
                  help={projectFieldHelp.emoji}
                  value={config.emoji}
                  error={errorFor(["emoji"])}
                  onChange={(value) => setValue("emoji", value)}
                />
                <TextField
                  label="Package prefix"
                  help={projectFieldHelp.packagePrefix}
                  value={config.packagePrefix}
                  error={errorFor(["packagePrefix"])}
                  onChange={(value) => setValue("packagePrefix", value)}
                />
                <div className="sm:col-span-2">
                  <TextField
                    label="Git URL"
                    help={projectFieldHelp.gitUrl}
                    value={config.gitUrl}
                    error={errorFor(["gitUrl"])}
                    placeholder="Optional"
                    onChange={(value) => setValue("gitUrl", value)}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card size="sm" className="h-full">
            <CardHeader className="border-b">
              <div>
                <CardTitle>Services and clients</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid min-h-0 gap-4 lg:grid-cols-2">
              <ListPanel
                title="Backend services"
                disabled={hasEmptyServiceField}
                onAdd={() =>
                  setValue("backendServices", [
                    ...config.backendServices,
                    "",
                  ])
                }
              >
                {config.backendServices.map((service, index) => {
                  const serviceError =
                    errorFor(["backendServices", index]) ??
                    duplicateServiceErrorFor(service);

                  return (
                    <CompactRow key={`backend-${index}`}>
                      <Input
                        aria-label={`Backend service ${index + 1}`}
                        value={service}
                        aria-invalid={Boolean(serviceError)}
                        onChange={(event) => {
                          const next = [...config.backendServices];
                          next[index] = toSlug(event.target.value);
                          setValue("backendServices", next);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Remove service"
                        aria-label="Remove service"
                        disabled={config.backendServices.length === 1}
                        onClick={() =>
                          setValue(
                            "backendServices",
                            config.backendServices.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                      {serviceError && (
                        <p className="col-span-full px-1 text-xs text-destructive">
                          {serviceError}
                        </p>
                      )}
                    </CompactRow>
                  );
                })}
              </ListPanel>

              <ListPanel
                title="Frontend clients"
                disabled={hasEmptyServiceField}
                onAdd={() =>
                  setValue("frontendClients", [
                    ...config.frontendClients,
                    {
                      slug: "",
                      type: "react-vite",
                    },
                  ])
                }
              >
                {config.frontendClients.map((client, index) => {
                  const clientError =
                    errorFor(["frontendClients", index, "slug"]) ??
                    duplicateServiceErrorFor(client.slug);

                  return (
                    <CompactRow key={`frontend-${index}`}>
                      <Input
                        aria-label={`Frontend client ${index + 1}`}
                        value={client.slug}
                        aria-invalid={Boolean(clientError)}
                        onChange={(event) => {
                          const next = [...config.frontendClients];
                          next[index] = {
                            ...client,
                            slug: toSlug(event.target.value),
                          };
                          setValue("frontendClients", next);
                        }}
                      />
                      <Select
                        value={client.type}
                        onValueChange={(value) => {
                          const next = [...config.frontendClients];
                          next[index] = {
                            ...client,
                            type: value as FrontendType,
                          };
                          setValue("frontendClients", next);
                        }}
                      >
                        <SelectTrigger
                          aria-label={`Frontend client ${index + 1} type`}
                          size="default"
                          className="w-[126px]"
                        >
                          <SelectValue>
                            {frontendTypeLabel(client.type)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {frontendTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Remove client"
                        aria-label="Remove client"
                        disabled={config.frontendClients.length === 1}
                        onClick={() =>
                          setValue(
                            "frontendClients",
                            config.frontendClients.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                      {clientError && (
                        <p className="col-span-full px-1 text-xs text-destructive">
                          {clientError}
                        </p>
                      )}
                    </CompactRow>
                  );
                })}
              </ListPanel>
              <div className="lg:col-span-2">
                <InlineHelp
                  open={servicesHelpOpen}
                  onOpenChange={setServicesHelpOpen}
                  title="How services and clients are used"
                >
                  <p>
                    Backend slugs create Fastify/tRPC services in{" "}
                    <code>apps/&lt;slug&gt;</code>. Client slugs create Vite or
                    Next.js apps in <code>apps/&lt;slug&gt;</code>. Starter
                    clients are wired to the primary backend through tRPC, and
                    all slugs are rendered into <code>zap.yaml</code>,{" "}
                    <code>.env.local</code>, and package names.
                  </p>
                </InlineHelp>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card size="sm">
          <Tabs defaultValue="prompt">
            <CardHeader className="border-b max-sm:grid-cols-1">
              <div>
                <CardTitle>Prompt</CardTitle>
                <CardDescription className="text-xs">
                  Copy this into your AI coding tool.
                </CardDescription>
              </div>
              <CardAction className="flex flex-wrap items-center gap-2 max-sm:col-start-1 max-sm:row-start-3 max-sm:mt-2 max-sm:justify-self-start">
                <TabsList>
                  <TabsTrigger value="prompt">Prompt</TabsTrigger>
                  <TabsTrigger value="raw">Raw values</TabsTrigger>
                </TabsList>
                <div className="flex flex-wrap items-center gap-2">
                  {isPromptDirty && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomPrompt(null)}
                    >
                      Reset
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    disabled={!result.success || !prompt}
                    onClick={copyPrompt}
                  >
                    {copied ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Copy aria-hidden="true" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <TabsContent value="prompt" className="mt-0">
                {result.success ? (
                  <div className="space-y-2">
                    <label className="flex w-fit items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={includePrerequisites}
                        onChange={(event) =>
                          updateIncludePrerequisites(event.target.checked)
                        }
                        className="size-4 rounded border border-input accent-primary"
                      />
                      Include prerequisites
                    </label>
                    <div>
                      <Textarea
                        value={prompt}
                        onChange={(event) => setCustomPrompt(event.target.value)}
                        className="min-h-[260px] resize-y overflow-auto rounded-lg bg-muted/30 p-4 font-mono text-xs leading-5 text-foreground lg:min-h-[200px]"
                      />
                      <p className="mt-0 pl-4 text-[0.68rem] leading-4 text-muted-foreground">
                        You are responsible for supervising your AI coding tool.
                        Make sure it does not install, run, delete, or change
                        anything without your approval.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    Fix validation issues before copying the prompt.
                  </div>
                )}
              </TabsContent>
              <TabsContent value="raw" className="mt-0">
                <div className="mb-2 text-xs text-muted-foreground">
                  {result.success
                    ? "Schema valid"
                    : `${issues.length} validation issue${issues.length === 1 ? "" : "s"}`}
                </div>
                <CodeBlock>{rawValues}</CodeBlock>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </main>
  );
}

function TextField({
  label,
  help,
  value,
  error,
  placeholder,
  onChange,
}: {
  label: string;
  help: string;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field data-invalid={Boolean(error)} className="gap-1.5">
      <FieldLabel className="text-xs">
        <Tooltip>
          <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-4">
            {label}
          </TooltipTrigger>
          <TooltipContent side="top" align="start">
            {help}
          </TooltipContent>
        </Tooltip>
      </FieldLabel>
      <Input
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError className="min-h-4 text-xs">{error}</FieldError>
    </Field>
  );
}

function AboutFssstack() {
  return (
    <>
      <p>
        Fssstack plugs into your agentic coding tool and gives it a working set
        of standards for building with this stack. The point is not just
        scaffolding; it gives the agent strong defaults for how code should be
        organized, validated, tested, and maintained.
      </p>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-foreground">
          What the agent gets
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Core stack assumptions such as TypeScript, tRPC, pnpm, Turbo,
            app/service layout, linting, tests, logging, and environment
            variable conventions.
          </li>
          <li>
            Opinionated implementation guidance for keeping generated code
            consistent instead of ad hoc.
          </li>
          <li>
            A growing library of extension docs for optional capabilities such
            as Clerk, BullMQ, S3, Redis, MongoDB, Playwright, and custom
            domains.
          </li>
        </ul>
      </div>
      <p>
        Read the{" "}
        <a
          href="https://github.com/mp-lb/fssstack/blob/main/SETUP_PROCESS.md"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline underline-offset-4"
        >
          setup process
        </a>{" "}
        before copying the prompt to see what will run in the target repo.
      </p>
    </>
  );
}

function useLocalStorageBoolean(key: string, defaultValue: boolean) {
  const eventName = `local-storage:${key}`;
  const getServerSnapshot = () => defaultValue;
  const getSnapshot = () => {
    const saved = window.localStorage.getItem(key);
    return saved === null ? defaultValue : saved === "true";
  };
  const subscribe = (callback: () => void) => {
    window.addEventListener("storage", callback);
    window.addEventListener(eventName, callback);

    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener(eventName, callback);
    };
  };
  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setValue = (nextValue: boolean) => {
    window.localStorage.setItem(key, String(nextValue));
    window.dispatchEvent(new Event(eventName));
  };

  return [value, setValue] as const;
}

function InlineHelp({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="rounded-lg border bg-muted/20">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
          {title}
          <ChevronDown
            aria-hidden="true"
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_strong]:font-medium [&_strong]:text-foreground">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function ListPanel({
  title,
  disabled,
  onAdd,
  children,
}: {
  title: string;
  disabled: boolean;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{title}</h2>
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          title={`Add ${title.toLowerCase()}`}
          aria-label={`Add ${title.toLowerCase()}`}
          disabled={disabled}
          onClick={onAdd}
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
      <div className="space-y-1.5 pr-1">
        {children}
      </div>
    </section>
  );
}

function CompactRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5 rounded-lg border bg-muted/25 p-1">
      {children}
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="min-h-[260px] overflow-auto rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-5 text-foreground">
      {children}
    </pre>
  );
}
