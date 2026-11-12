"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Search, TriangleAlert, X } from "lucide-react";
import { usePlant } from "./plant-context";
import { getSiteBlock, getSiteBlocks } from "@/data/site-layout";
import { resolvePlantAsset } from "@/lib/plant-assets";
import { type Asset, typeNames } from "@/data/plant";
import { assetStatus } from "@/lib/asset-status";
import { baseline, timeLabel } from "@/lib/simulation";
import { number, signalLabel } from "./device-profile";

const levels: Record<string, string> = {
  normal: "Bình thường",
  warning: "Lưu ý",
  critical: "Cảnh báo",
};

export function DeviceListDialog({
  assets,
  selected,
  frame,
  onSelect,
  onDetails,
  onClose,
  modeLabel,
}: {
  assets: Asset[];
  selected: string | null;
  frame: React.RefObject<HTMLDivElement | null>;
  onSelect: (id: string) => void;
  onDetails: (id: string) => void;
  onClose: () => void;
  modeLabel: string;
}) {
  const { plantId } = usePlant();
  const selectedBlock = getSiteBlock(plantId, selected);
  const [scope, setScope] = useState(selectedBlock?.parentId ?? "assets");
  const [page, setPage] = useState(
    selectedBlock ? Math.floor(selectedBlock.index / 40) : 0,
  );
  const ref = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  useEffect(() => {
    const dialog = ref.current;
    const container = frame.current;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (!dialog || !container) return;
    const position = () => {
      const box = container.getBoundingClientRect();
      const top = Math.max(8, box.top + 8);
      const left = Math.max(8, box.left + 8);
      Object.assign(dialog.style, {
        top: `${top}px`,
        left: `${left}px`,
        width: `${Math.max(180, Math.min(box.width - 16, window.innerWidth - left - 8))}px`,
        height: `${Math.max(180, Math.min(box.bottom - 8, window.innerHeight - 8) - top)}px`,
      });
    };
    position();
    dialog.showModal();
    dialog
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Đóng danh sách thiết bị"]',
      )
      ?.focus({ preventScroll: true });
    const resize = new ResizeObserver(position);
    resize.observe(container);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      resize.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      if (dialog.open) dialog.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [frame]);
  const query = search.trim().toLocaleLowerCase("vi");
  const candidates = useMemo(() => {
    if (plantId === "sava") return assets;
    const children =
      scope !== "assets"
        ? getSiteBlocks(plantId).filter((b) => b.parentId === scope)
        : /^pv-\d{2}-/i.test(query)
          ? getSiteBlocks(plantId).filter((block) =>
              block.id.toLowerCase().includes(query),
            )
          : null;
    return children
      ? children
          .map((block) => resolvePlantAsset(assets, block.id, plantId)!)
          .filter(Boolean)
      : assets;
  }, [assets, plantId, scope, query]);
  const filtered = candidates.filter(
    (asset) =>
      (level === "all" || assetStatus(asset).level === level) &&
      `${asset.id} ${asset.name} ${asset.area}`
        .toLocaleLowerCase("vi")
        .includes(query),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 40));
  const visiblePage = Math.min(page, pages - 1);
  const visible = filtered.slice(visiblePage * 40, (visiblePage + 1) * 40);
  return (
    <dialog
      ref={ref}
      id="device-list-dialog"
      className="device-tree device-list-dialog"
      aria-labelledby="device-list-title"
      onCancel={onClose}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
          return;
        }
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), select:not(:disabled)",
          ),
        );
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <header className="device-list-header">
        <div>
          <span className="eyebrow">THIẾT BỊ NHÀ MÁY</span>
          <h2 id="device-list-title">Danh sách thiết bị</h2>
          <p>
            Trạng thái và thông số theo {modeLabel}. Chọn mã thiết bị để xem
            trên 3D.
          </p>
        </div>
        <button
          className="icon-button"
          aria-label="Đóng danh sách thiết bị"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      <div className="device-list-tools">
        <label className="device-list-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Tìm thiết bị</span>
          <input
            type="search"
            placeholder="Tìm mã, tên hoặc khu vực…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label>
          <span className="sr-only">Lọc trạng thái thiết bị</span>
          <select
            aria-label="Lọc trạng thái thiết bị"
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(levels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <span className="device-list-count" role="status">
          {filtered.length}/{candidates.length} thiết bị
        </span>
      </div>
      {plantId !== "sava" && (
        <div className="block-list-navigation">
          <label>
            Phạm vi{" "}
            <select
              aria-label="Cấp chi tiết thiết bị"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                setSearch("");
                setPage(0);
              }}
            >
              <option value="assets">Vùng pin và thiết bị</option>
              {assets
                .filter((a) => a.type === "pv" && !a.parentId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    Cụm nhỏ trong {a.id} · {a.area}
                  </option>
                ))}
            </select>
          </label>
          {scope !== "assets" && (
            <span>Số liệu phân bổ từ vùng, không phải số đo riêng.</span>
          )}
        </div>
      )}
      <div className="device-list-scroll">
        {!filtered.length && (
          <p className="device-list-empty">Không tìm thấy thiết bị phù hợp.</p>
        )}
        {Object.entries(typeNames).map(([type, name]) => {
          const group = visible.filter((a) => a.type === type);
          if (!group.length) return null;
          return (
            <section key={type} aria-label={name} className="device-list-group">
              <h3>
                {name}
                <span>{group.length}</span>
              </h3>
              <div className="device-buttons device-list-items">
                {group.map((asset) => {
                  const status = assetStatus(asset);
                  const operation =
                    asset.operatingState === "stopped"
                      ? "Dừng phát điện"
                      : status.label;
                  return (
                    <article
                      key={asset.id}
                      className={`device-list-row ${status.level}`}
                      data-asset={asset.id}
                    >
                      <div className="device-list-identity">
                        <button
                          className={`device-status-button ${status.level}`}
                          data-status={status.level}
                          aria-label={asset.id}
                          aria-describedby={`device-status-${asset.id}`}
                          aria-pressed={selected === asset.id}
                          title={`Xem ${asset.id} trên 3D`}
                          onClick={() => onSelect(asset.id)}
                        >
                          {status.level === "critical" ? (
                            <TriangleAlert size={14} aria-hidden="true" />
                          ) : (
                            <i
                              className="device-status-dot"
                              aria-hidden="true"
                            />
                          )}
                          {asset.id}
                          <ArrowUpRight size={13} aria-hidden="true" />
                        </button>
                        <strong>{asset.name}</strong>
                        <span>
                          {asset.area} ·{" "}
                          {asset.nominal
                            .replace(" · cụm đại diện", "")
                            .replace(" · heartbeat mẫu", "")}
                        </span>
                        <span
                          className={`device-list-state ${status.level}`}
                          id={`device-status-${asset.id}`}
                        >
                          {levels[status.level]}
                          {operation === levels[status.level]
                            ? ""
                            : ` · ${operation}`}
                        </span>
                      </div>
                      <dl className="device-list-signals">
                        {asset.signals.map((signal) => {
                          const unavailable =
                            signal.value === null ||
                            signal.quality === "invalid" ||
                            signal.quality === "missing";
                          const fault =
                            asset.type === "inverter" &&
                            signal.id.endsWith(".fault");
                          return (
                            <div key={signal.id} data-signal={signal.id}>
                              <dt>
                                {fault
                                  ? "Trạng thái inverter"
                                  : signalLabel(asset, signal)}
                              </dt>
                              <dd>
                                {unavailable
                                  ? "—"
                                  : fault
                                    ? signal.value === 0
                                      ? asset.operation
                                      : "Đang lỗi"
                                    : number(signal.value!)}{" "}
                                {!unavailable && !fault && (
                                  <small>{signal.unit}</small>
                                )}
                              </dd>
                              {signal.quality !== "valid" && (
                                <small className="device-signal-quality">
                                  {signal.quality === "stale"
                                    ? "Dữ liệu cũ"
                                    : signal.quality === "invalid"
                                      ? "Không hợp lệ"
                                      : "Thiếu dữ liệu"}
                                </small>
                              )}
                            </div>
                          );
                        })}
                      </dl>
                      {status.reason && (
                        <p className={`device-list-reason ${status.level}`}>
                          <TriangleAlert size={13} aria-hidden="true" />
                          {status.reason}
                        </p>
                      )}
                      <footer>
                        <span>
                          Cập nhật{" "}
                          {timeLabel(asset.sampledAt ?? baseline.start)} ICT
                        </span>
                        <button
                          className="device-row-details"
                          aria-label={`Xem chi tiết ${asset.id}`}
                          onClick={() => onDetails(asset.id)}
                        >
                          Xem chi tiết{" "}
                          <ArrowUpRight size={12} aria-hidden="true" />
                        </button>
                      </footer>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      {pages > 1 && (
        <div className="block-list-pages">
          <button
            disabled={visiblePage === 0}
            onClick={() => setPage(visiblePage - 1)}
          >
            Trang trước
          </button>
          <span>
            {visiblePage + 1}/{pages}
          </span>
          <button
            disabled={visiblePage === pages - 1}
            onClick={() => setPage(visiblePage + 1)}
          >
            Trang tiếp
          </button>
        </div>
      )}
    </dialog>
  );
}
