import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Shell Header Preview */}
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-h3 font-bold text-primary">CareSync</h1>
            <p className="text-caption text-muted-foreground">
              Design System &amp; Shell Foundation Preview
            </p>
          </div>
          <Badge variant="success">Foundation Verified</Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl p-6 sm:p-8 space-y-8">
        <div className="space-y-2">
          <h2 className="text-h2">Design System &amp; Primitives</h2>
          <p className="text-body text-muted-foreground">
            Semantic design tokens, accessible UI primitives, and layout shells prepared for Stitch
            design integration.
          </p>
        </div>

        {/* Badges Section */}
        <section className="space-y-3">
          <h3 className="text-h4">Semantic Badges</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default / Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="neutral">Neutral</Badge>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="space-y-3">
          <h3 className="text-h4">Buttons</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="primary" isLoading>
              Loading
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </section>

        {/* Form Inputs & Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Inputs Section */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Input Primitives</CardTitle>
                <CardDescription>
                  Accessible form input states with labels, helper text, and validation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Standard Input"
                  placeholder="Enter text..."
                  helperText="General purpose helper text"
                />
                <Input
                  label="Required Input"
                  required
                  placeholder="Required field..."
                />
                <Input
                  label="Validation Error State"
                  error="This field is required or invalid"
                  defaultValue="Invalid input value"
                />
                <Input
                  label="Disabled Input"
                  disabled
                  placeholder="Disabled input"
                />
              </CardContent>
            </Card>
          </section>

          {/* Cards & Composition Section */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Composable Card System</CardTitle>
                <CardDescription>
                  Structural container for statistics, widgets, forms, and lists.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-body text-muted-foreground">
                  CareSync components consume centralized CSS design tokens defined in{" "}
                  <code className="text-caption font-mono bg-surface-muted px-1.5 py-0.5 rounded">
                    globals.css
                  </code>
                  .
                </p>
                <div className="rounded-md border border-border p-4 bg-surface-muted">
                  <span className="text-label text-foreground">Next Step:</span>
                  <p className="text-small text-muted-foreground mt-1">
                    Translate individual Google Stitch designs into portal-specific components and
                    routes.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-caption text-muted-foreground">
                  Architecture Status: Clean
                </span>
                <a
                  href="/patient"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  View Patient Portal →
                </a>
              </CardFooter>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
