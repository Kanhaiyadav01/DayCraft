import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Maximize2, Minimize2, Clock as ClockIcon, Calendar } from "lucide-react";
import { Card, Button, Badge, Tape } from "@/components/notebook";
import { Shell } from "@/components/notebook/Shell";

export const Route = createFileRoute("/_authenticated/clock")({
  head: () => ({ meta: [{ title: "Clock · DayCraft" }] }),
  component: ClockPage,
});

import { toast } from "sonner";

interface FullscreenHTMLElement extends HTMLElement {
  requestFullscreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

interface FullscreenDocument extends Document {
  webkitExitFullscreen?: () => void;
  mozCancelFullScreen?: () => void;
  msExitFullscreen?: () => void;
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
}

// Request browser fullscreen
function ClockPage() {
  const [time, setTime] = React.useState(new Date());
  const [is24Hour, setIs24Hour] = React.useState(false);
  const [isAppFullscreen, setIsAppFullscreen] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = React.useMemo(() => {
    let hh = time.getHours();
    const mm = String(time.getMinutes()).padStart(2, "0");
    const ss = String(time.getSeconds()).padStart(2, "0");
    let ampm = "";

    if (!is24Hour) {
      ampm = hh >= 12 ? " PM" : " AM";
      hh = hh % 12;
      hh = hh ? hh : 12; // the hour '0' should be '12'
    }

    const hhStr = String(hh).padStart(2, "0");
    return `${hhStr}:${mm}:${ss}${ampm}`;
  }, [time, is24Hour]);

  const dateString = React.useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return time.toLocaleDateString(undefined, options);
  }, [time]);

  const toggleBrowserFullscreen = () => {
    const docEl = document.documentElement as FullscreenHTMLElement;
    const requestFs =
      docEl.requestFullscreen ||
      docEl.webkitRequestFullscreen ||
      docEl.mozRequestFullScreen ||
      docEl.msRequestFullscreen;
    const doc = document as FullscreenDocument;
    const exitFs =
      doc.exitFullscreen ||
      doc.webkitExitFullscreen ||
      doc.mozCancelFullScreen ||
      doc.msExitFullscreen;

    if (!requestFs) {
      toast.info(
        "Fullscreen API is not supported by your browser. Falling back to simulated fullscreen overlay.",
      );
      setIsAppFullscreen(!isAppFullscreen);
      return;
    }

    const isFs = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isFs) {
      const promise = requestFs.call(docEl);
      if (promise && typeof promise.then === "function") {
        promise
          .then(() => {
            setIsAppFullscreen(true);
          })
          .catch((err: unknown) => {
            console.error("Error attempting to enable full-screen mode:", err);
            setIsAppFullscreen(true);
          });
      } else {
        setIsAppFullscreen(true);
      }
    } else {
      if (exitFs) {
        exitFs.call(doc);
      }
      setIsAppFullscreen(false);
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as FullscreenDocument;
      const isFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsAppFullscreen(isFs);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  const clockContent = (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none space-y-6">
      <div className="flex items-center gap-2">
        <Badge tone="accent" className="px-3 py-1 text-sm font-body">
          <ClockIcon className="h-4 w-4 mr-1 inline" /> Live Clock
        </Badge>
        <Badge tone="mint" className="px-3 py-1 text-sm font-body">
          <Calendar className="h-4 w-4 mr-1 inline" /> {dateString}
        </Badge>
      </div>

      <div
        className="font-hand font-bold tracking-wider leading-none text-ink select-none my-6 text-[clamp(3.5rem,15vw,9rem)]"
        style={{ textShadow: "1px 1px 0px var(--rule)" }}
      >
        {timeString}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setIs24Hour(!is24Hour)}
          className="font-hand text-lg"
        >
          Format: {is24Hour ? "24-Hour" : "12-Hour"}
        </Button>
        <Button variant="outline" onClick={toggleBrowserFullscreen} className="font-hand text-lg">
          {isAppFullscreen ? (
            <>
              <Minimize2 className="h-4 w-4 mr-1 inline" /> Exit Fullscreen
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4 mr-1 inline" /> Enter Fullscreen
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (isAppFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-paper flex flex-col items-center justify-center p-4 cursor-default">
        {/* Floating buttons that appear on hover */}
        <div className="absolute top-5 right-5 opacity-0 hover:opacity-100 transition-opacity flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIs24Hour(!is24Hour)}>
            Format: {is24Hour ? "24H" : "12H"}
          </Button>
          <Button variant="danger" size="sm" onClick={toggleBrowserFullscreen}>
            <Minimize2 className="h-4 w-4" /> Exit
          </Button>
        </div>
        {clockContent}
      </div>
    );
  }

  return (
    <Shell>
      <div className="px-4 py-8 sm:px-8 lg:px-12 min-h-[85vh] flex flex-col justify-center">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <header className="relative paper-card p-6">
            <Tape className="absolute -top-3 left-10" rotate={-4} />
            <p className="font-hand text-xl text-ink-soft">distraction-free timekeeping</p>
            <h1 className="font-hand text-5xl">
              <span className="highlight-marker">Fullscreen Clock</span>
            </h1>
            <p className="text-ink-soft mt-2">
              Stay aware of every moment with a clean, distraction-free live clock.
            </p>
          </header>

          <Card className="flex flex-col items-center justify-center min-h-[40vh] relative p-10">
            <Tape className="absolute -top-3 right-12 w-24 h-4" rotate={4} />
            {clockContent}
          </Card>
        </div>
      </div>
    </Shell>
  );
}
