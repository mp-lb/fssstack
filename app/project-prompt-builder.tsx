"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Check,
  Clipboard,
  Copy,
  ExternalLink,
  FlaskConical,
  GitCommit,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
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

const slugChoices = {
  backend: [
    "backend",
    "backend-api",
    "backend-worker",
    "backend-jobs",
    "backend-sync",
    "backend-admin",
  ],
  frontend: [
    "frontend",
    "frontend-web",
    "frontend-admin",
    "frontend-dashboard",
    "frontend-console",
    "frontend-marketing",
  ],
};

const nextSlug = (kind: keyof typeof slugChoices, existing: string[]) => {
  const used = new Set(existing);
  const option = slugChoices[kind].find((slug) => !used.has(slug));

  if (option) {
    return option;
  }

  let slug = `${kind}-extra`;
  while (used.has(slug)) {
    slug = `${slug}-extra`;
  }

  return slug;
};

const buildPrompt = (config: ProjectPromptConfig) => `Set up this project in the current repository.

1. Create a new directory in this repo called \`.fssstack\`.
2. Download fssstack with \`curl -fsSL https://github.com/mp-lb/fssstack/archive/refs/heads/main.tar.gz | tar -xz --strip-components=1 -C .fssstack\`.
3. Read \`.fssstack/SETUP_PROCESS.md\` and follow the instructions.

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
  const [copied, setCopied] = useState(false);

  const normalizedConfig = useMemo(
    () => normalizeProjectPromptConfig(config),
    [config],
  );
  const result = useMemo(
    () => projectPromptSchema.safeParse(normalizedConfig),
    [normalizedConfig],
  );
  const prompt = result.success ? buildPrompt(result.data) : "";
  const issues = result.success ? [] : result.error.issues;

  const errorFor = (path: (string | number)[]) =>
    issues.find((issue) => fieldId(issue.path) === fieldId(path))?.message;

  const setValue = <Key extends keyof ProjectPromptConfig>(
    key: Key,
    value: ProjectPromptConfig[Key],
  ) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const updateName = (name: string) => {
    setConfig((current) => {
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
    <main className="min-h-screen bg-[#0b0d12] text-zinc-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-cyan-300">
              <Sparkles size={15} aria-hidden="true" />
              Prompt config builder
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-white sm:text-4xl">
              Fssstack
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="https://github.com/mp-lb/fssstack"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-cyan-300/30 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200 hover:bg-cyan-300/20"
            >
              <GitCommit size={16} aria-hidden="true" />
              GitHub Repo
            </a>
            <a
              href="https://www.mp-lb.dev"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-100 transition hover:border-white/25 hover:bg-white/10"
            >
              <FlaskConical size={16} aria-hidden="true" />
              MAP Lab Home
            </a>
            <div className="flex h-12 items-center gap-2 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 text-sm text-emerald-100">
              {result.success ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <AlertCircle size={16} aria-hidden="true" />
              )}
              {result.success ? "Schema valid" : `${issues.length} validation issue${issues.length === 1 ? "" : "s"}`}
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
          <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">Project</h2>
                <span className="font-mono text-xs text-zinc-500">strict JSON</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Name"
                  value={config.name}
                  error={errorFor(["name"])}
                  onChange={updateName}
                />
                <TextField
                  label="Slug"
                  value={config.slug}
                  error={errorFor(["slug"])}
                  onChange={(value) => setValue("slug", toSlug(value))}
                />
                <TextField
                  label="Emoji"
                  value={config.emoji}
                  error={errorFor(["emoji"])}
                  onChange={(value) => setValue("emoji", value)}
                />
                <TextField
                  label="Package prefix"
                  value={config.packagePrefix}
                  error={errorFor(["packagePrefix"])}
                  onChange={(value) => setValue("packagePrefix", value)}
                />
                <div className="sm:col-span-2">
                  <TextField
                    label="Git URL"
                    value={config.gitUrl}
                    error={errorFor(["gitUrl"])}
                    onChange={(value) => setValue("gitUrl", value)}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-5">
              <ListHeader
                title="Backend services"
                onAdd={() =>
                  setValue("backendServices", [
                    ...config.backendServices,
                    nextSlug("backend", config.backendServices),
                  ])
                }
              />

              <div className="space-y-3">
                {config.backendServices.map((service, index) => (
                  <ListRow key={`${service}-${index}`} columns="two">
                    <TextField
                      label={`Service ${index + 1}`}
                      value={service}
                      error={errorFor(["backendServices", index])}
                      onChange={(value) => {
                        const next = [...config.backendServices];
                        next[index] = toSlug(value);
                        setValue("backendServices", next);
                      }}
                    />
                    <IconButton
                      label="Remove service"
                      disabled={config.backendServices.length === 1}
                      onClick={() =>
                        setValue(
                          "backendServices",
                          config.backendServices.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </IconButton>
                  </ListRow>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-5">
              <ListHeader
                title="Frontend clients"
                onAdd={() =>
                  setValue("frontendClients", [
                    ...config.frontendClients,
                    {
                      slug: nextSlug(
                        "frontend",
                        config.frontendClients.map((client) => client.slug),
                      ),
                      type: "react-vite",
                    },
                  ])
                }
              />

              <div className="space-y-3">
                {config.frontendClients.map((client, index) => (
                  <ListRow key={`${client.slug}-${index}`} columns="three">
                    <TextField
                      label={`Client ${index + 1}`}
                      value={client.slug}
                      error={errorFor(["frontendClients", index, "slug"])}
                      onChange={(value) => {
                        const next = [...config.frontendClients];
                        next[index] = { ...client, slug: toSlug(value) };
                        setValue("frontendClients", next);
                      }}
                    />
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-zinc-300">Type</span>
                      <select
                        className="h-11 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                        value={client.type}
                        onChange={(event) => {
                          const next = [...config.frontendClients];
                          next[index] = {
                            ...client,
                            type: event.target.value as FrontendType,
                          };
                          setValue("frontendClients", next);
                        }}
                      >
                        {frontendTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <IconButton
                      label="Remove client"
                      disabled={config.frontendClients.length === 1}
                      onClick={() =>
                        setValue(
                          "frontendClients",
                          config.frontendClients.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </IconButton>
                  </ListRow>
                ))}
              </div>
            </section>
          </form>

          <aside className="grid gap-6 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-lg border border-white/10 bg-[#10141d] p-4 shadow-2xl shadow-black/30 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">JSON object</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Normalized before validation.
                  </p>
                </div>
                <Clipboard className="text-cyan-300" size={18} aria-hidden="true" />
              </div>
              <pre className="max-h-[320px] overflow-auto rounded-md border border-white/10 bg-black/45 p-4 font-mono text-xs leading-6 text-cyan-50">
                {JSON.stringify(normalizedConfig, null, 2)}
              </pre>
            </section>

            <section className="rounded-lg border border-white/10 bg-[#10141d] p-4 shadow-2xl shadow-black/30 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Generated prompt</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Copy when the schema passes.
                  </p>
                </div>
                <button
                  type="button"
                  title="Copy generated prompt"
                  aria-label="Copy generated prompt"
                  disabled={!result.success}
                  onClick={copyPrompt}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-cyan-300/30 bg-cyan-300/10 text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-zinc-600"
                >
                  {copied ? (
                    <Check size={17} aria-hidden="true" />
                  ) : (
                    <Copy size={17} aria-hidden="true" />
                  )}
                </button>
              </div>

              {result.success ? (
                <pre className="max-h-[420px] whitespace-pre-wrap overflow-auto rounded-md border border-white/10 bg-black/45 p-4 font-mono text-xs leading-6 text-zinc-100">
                  {prompt}
                </pre>
              ) : (
                <div className="rounded-md border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
                  Fix validation issues before copying the prompt.
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function TextField({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <input
        className="h-11 min-w-0 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="min-h-5 text-xs text-red-300">{error}</span>
    </label>
  );
}

function ListHeader({
  title,
  onAdd,
}: {
  title: string;
  onAdd: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <button
        type="button"
        title={`Add ${title.toLowerCase()}`}
        aria-label={`Add ${title.toLowerCase()}`}
        onClick={onAdd}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 hover:text-cyan-100"
      >
        <Plus size={17} aria-hidden="true" />
      </button>
    </div>
  );
}

function ListRow({
  columns,
  children,
}: Readonly<{
  columns: "two" | "three";
  children: ReactNode;
}>) {
  const columnClass =
    columns === "two"
      ? "sm:grid-cols-[minmax(0,1fr)_40px]"
      : "sm:grid-cols-[minmax(0,1fr)_180px_40px]";

  return (
    <div
      className={`grid gap-3 rounded-md border border-white/10 bg-black/20 p-3 ${columnClass} sm:items-start`}
    >
      {children}
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="mt-7 inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-300 transition hover:border-red-300/50 hover:bg-red-300/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}
