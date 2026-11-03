import { ChevronRight } from "lucide-react";
import { PageHeader } from "./primitives";
import "./HelpPage.css";

// FAQ content displayed on the Help page.
// Each item contains a unique ID, a question, and its corresponding answer.
const FAQ_ITEMS = [
    {
        id: "saving",
        question: "Do I need to save my changes manually?",
        answer: (
            <>
                Project plan changes save automatically in this browser.
                The indicator at the top right shows <strong>Saving…</strong> while
                a save is in progress and <strong>Saved locally</strong> when it
                has completed. Submit any open form to apply its changes.
            </>
        ),
    },
    {
        id: "project",
        question: "Why do I need to open a project first?",
        answer: (
            <>
                Chapters, characters, locations, events and timelines belong
                to a project. Open the story you want from <strong>Projects</strong>,
                then return to the relevant page.
            </>
        ),
    },
    {
        id: "backup",
        question: "How do I back up or move my projects?",
        answer: (
            <>
                Open <strong>Backup &amp; Restore</strong> and choose{" "}
                <strong>Download backup</strong>. To move your work, open the app
                in the other browser or computer and restore that{" "}
                <strong>.json</strong> backup. Review the restore options before
                confirming. <strong>Export</strong> downloads an Excel planning
                sheet; use the JSON backup when you need to restore your work.
            </>
        ),
    },
    {
        id: "failure",
        question: "What should I do if saving fails?",
    answer: (
        <>
            Choose <strong>Retry</strong> in the save error banner.
            If the problem continues, use <strong>Export backup</strong> in
            the same banner to keep a separate copy before leaving the page.
        </>
        ),
    },
    {
        id: "timeline",
        question: "Why is my timeline empty?",
        answer: (
            <>
                Check that the correct project is open. In <strong>Events</strong>,
                add an event or scene, fill in its date information and save it.
                Return to <strong>Timeline</strong> to see the recorded story
                chronology.
            </>
        ),
    },
];

// Renders the FAQ section with expandable questions and answers.
export function HelpPage() {
    return (
        <div className="page-stack core-page help-page">
            {/* Displays the page title and shared header styling. */}
            <PageHeader title="Help" />

            {/* Groups frequently asked questions under a labelled section. */}
            <section
                className="help-faq"
                aria-labelledby="help-faq-heading"
            >
                <h2 id="help-faq-heading">Frequently asked questions</h2>

                {/* Maps each FAQ item to an expandable disclosure element. */}
                <div className="help-faq-list">
                    {FAQ_ITEMS.map((item) => (
                        <details className="help-faq-item" key={item.id}>
                            <summary>
                                <span>{item.question}</span>

                                {/* Decorative icon indicating the expandable item. */}
                                <ChevronRight size={16} aria-hidden="true" />
                            </summary>

                            {/* Displays the answer when the question is expanded. */}
                            <p>{item.answer}</p>
                        </details>
                    ))}
                </div>
            </section>
        </div>
    );
}