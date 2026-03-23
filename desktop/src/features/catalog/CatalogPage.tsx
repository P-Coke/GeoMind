import type { DatasetEntry } from "../../shared/types";
import { useI18n } from "../../shared/i18n";

export function CatalogPage(props: { datasets: DatasetEntry[] }) {
  const { t } = useI18n();

  return (
    <div className="page-grid" data-testid="catalog-page">
      <section className="card page-hero">
        <div className="panel-title">{t("page.catalog.title")}</div>
        <p>{t("page.catalog.subtitle")}</p>
      </section>
      <section className="card">
        <div className="panel-title">{t("catalog.datasets")}</div>
        <div className="scroll-list tall">
          {props.datasets.map((dataset) => (
            <div key={dataset.id} className="list-item stacked">
              <strong>{dataset.name}</strong>
              <small>{dataset.id}</small>
              <span>{dataset.description}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <div className="panel-title">{t("catalog.local")}</div>
        <div className="info-callout">GeoJSON, CSV, GeoTIFF</div>
      </section>
    </div>
  );
}
