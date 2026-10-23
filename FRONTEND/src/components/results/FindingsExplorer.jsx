import { useRef, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import FindingsFilters from "./FindingsFilters";
import FindingsTable from "./FindingsTable";
import FindingDetail from "./FindingDetail";
import {
  SEVERITIES,
  searchFindings,
  countByLevel,
  filterFindings,
} from "../../utils/findings";

// Holds the filter state and filters in memory (the API sends up to 500 findings).
export default function FindingsExplorer({ findings }) {
  const [levels, setLevels] = useState(SEVERITIES); // chips that are switched on
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null); // the finding shown in the panel
  const triggerRef = useRef(null); // the row that was clicked

  const allOn = levels.length === SEVERITIES.length;
  const canClear = !allOn || query.trim() !== "";

  // Chip numbers follow the search box, so they always match what you would see.
  const counts = countByLevel(searchFindings(findings, query));
  const visible = filterFindings(findings, { levels, query });

  function toggleLevel(level) {
    setLevels((current) =>
      current.includes(level)
        ? current.filter((l) => l !== level)
        : [...current, level]
    );
  }

    function openDetail(finding, rowButton) {
    triggerRef.current = rowButton;
    setSelected(finding);
  }

  function closeDetail() {
    setSelected(null);
    triggerRef.current?.focus(); // give focus back to the row
  }
  function clear() {
    setLevels(SEVERITIES);
    setQuery("");
  }

  return (
    <div>
      <FindingsFilters
        levels={levels}
        counts={counts}
        query={query}
        onToggleLevel={toggleLevel}
        onQueryChange={setQuery}
        onClear={clear}
        canClear={canClear}
      />

      <p aria-live="polite" className="mb-3 text-sm text-muted">
        Showing {visible.length} of {findings.length} findings
      </p>

      {visible.length === 0 ? (
        <Card className="text-center">
          <p className="font-semibold">No findings match your filters</p>
          <p className="mt-1 text-sm text-muted">
            Try a different search or switch more severities on.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={clear}>
              Clear filters
            </Button>
          </div>
        </Card>
      ) : (
         <FindingsTable findings={visible} onSelect={openDetail} />
      )}
        {selected && <FindingDetail finding={selected} onClose={closeDetail} />}
    </div>
  );
}