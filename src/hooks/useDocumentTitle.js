import { useEffect } from "react";

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · UU Student Hub` : "UU Student Hub";
  }, [title]);
}
