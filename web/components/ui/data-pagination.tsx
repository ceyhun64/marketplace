import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Simple prev/page-info/next pagination for data tables. */
export function DataPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: DataPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex justify-center items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="w-3.5 h-3.5 mr-1" />
        Previous
      </Button>
      <span className="px-3 py-1 text-sm text-(--text-secondary)">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronRight className="w-3.5 h-3.5 ml-1" />
      </Button>
    </div>
  );
}
