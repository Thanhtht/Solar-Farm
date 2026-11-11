import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, Sun } from "lucide-react";
import { plants } from "@/data/plants";

export default function Page() {
  return (
    <div className="plant-directory">
      <header className="directory-header">
        <Image
          src="/brand/sava-logo.png"
          alt="SAVA — GOOD TO GREAT"
          width={808}
          height={632}
          priority
          unoptimized
        />
        <span>
          Digital Twin <span className="directory-header-divider">/</span> Nhà
          máy điện
        </span>
      </header>
      <main className="directory-main">
        <div className="directory-intro">
          <p className="directory-eyebrow">HỆ THỐNG NHÀ MÁY ĐIỆN</p>
          <h1>Khám phá từng nhà máy.</h1>
          <p>
            Chọn nhà máy để xem hiện trạng, trải nghiệm mô phỏng và phân tích dữ
            liệu vận hành.
          </p>
        </div>
        <section aria-labelledby="directory-list-title">
          <div className="directory-list-heading">
            <h2 id="directory-list-title">
              Danh sách nhà máy{" "}
              <span>{plants.length.toLocaleString("vi-VN")}</span>
            </h2>
            <span>Bản sao số · Dữ liệu mô phỏng</span>
          </div>
          <ul className="directory-grid">
            {plants.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`plant-card ${item.id === "hong-liem-3" ? "plant-card-hong-liem" : ""}`}
                  aria-label={`Khám phá ${item.name}`}
                >
                  <div className="plant-card-visual" aria-hidden="true">
                    <span className="plant-card-type">
                      <Sun size={15} /> Điện mặt trời
                    </span>
                    <Sun className="plant-card-sun" size={60} strokeWidth={1} />
                    <div className="plant-card-panels">
                      {Array.from({ length: 12 }, (_, index) => (
                        <span key={index} />
                      ))}
                    </div>
                    <span className="plant-card-visual-label">
                      {item.visualLabel} <small>DIGITAL TWIN</small>
                    </span>
                  </div>
                  <div className="plant-card-content">
                    <p className="plant-card-caption">NHÀ MÁY ĐIỆN MẶT TRỜI</p>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <dl className="plant-card-specs">
                      <div>
                        <dt>Công suất DC</dt>
                        <dd>
                          {item.dcMWp} <span>MWp</span>
                        </dd>
                      </div>
                      <div>
                        <dt>{item.acLabel}</dt>
                        <dd>
                          {item.acMW} <span>MW</span>
                        </dd>
                      </div>
                    </dl>
                    <div className="plant-card-action">
                      Khám phá nhà máy <ArrowRight size={19} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            <li className="directory-coming-soon">
              <span className="directory-coming-icon">
                <Boxes size={28} strokeWidth={1.5} />
              </span>
              <h3>Thêm những nhà máy mới</h3>
              <p>
                Danh sách sẽ được mở rộng khi các nhà máy tiếp theo được bổ
                sung.
              </p>
            </li>
          </ul>
        </section>
      </main>
      <footer className="directory-footer">
        SAVA · Digital Twin <span>Khám phá · Mô phỏng · Phân tích</span>
      </footer>
    </div>
  );
}
