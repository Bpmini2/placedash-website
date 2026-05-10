"use client";

export default function HomePage() {
  return (
    <main
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "0 32px",
        backgroundImage:
          'linear-gradient(rgba(2,8,18,0.82), rgba(2,8,18,0.86)), url("/raceday.png")',
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        <header
          style={{
            width: "calc(100vw - 44px)",
            marginLeft: "calc(50% - 50vw + 22px)",
            marginTop: "18px",
            background: "rgba(255,255,255,0.97)",
            borderRadius: "30px",
            padding: "22px 48px",
            boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "18px",
                  background:
                    "linear-gradient(135deg, #22c55e, #1aff7a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#07111f",
                  fontWeight: 900,
                  fontSize: "26px",
                  boxShadow: "0 10px 25px rgba(34,197,94,0.35)",
                }}
              >
                123
              </div>

              <div
                style={{
                  fontSize: "58px",
                  fontWeight: 900,
                  color: "#07111f",
                  letterSpacing: "-2px",
                }}
              >
                PlaceDash
              </div>
            </div>

            <nav
              style={{
                display: "flex",
                gap: "42px",
                alignItems: "center",
              }}
            >
              <a
                href="/dashboard"
                style={{
                  color: "#07111f",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Predictions
              </a>

              <a
                href="#method"
                style={{
                  color: "#07111f",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Method
              </a>

              <a
                href="#track-record"
                style={{
                  color: "#07111f",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Track Record
              </a>

              <a
                href="#pricing"
                style={{
                  color: "#07111f",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Pricing
              </a>
            </nav>

            <a
              href="/dashboard"
              style={{
                background: "#22c55e",
                color: "#07111f",
                padding: "18px 32px",
                borderRadius: "18px",
                textDecoration: "none",
                fontWeight: 900,
                fontSize: "18px",
                boxShadow: "0 12px 28px rgba(34,197,94,0.35)",
              }}
            >
              View Today’s Picks
            </a>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.9fr",
            gap: "48px",
            alignItems: "center",
            padding: "90px 0 120px",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "10px 18px",
                borderRadius: "999px",
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.35)",
                color: "#86efac",
                fontWeight: 700,
                marginBottom: "24px",
              }}
            >
              Australian racing only • Place analysis
            </div>

            <h1
              style={{
                fontSize: "92px",
                lineHeight: "0.96",
                letterSpacing: "-4px",
                color: "#ffffff",
                margin: 0,
                fontWeight: 900,
              }}
            >
              Daily AI Place
              <br />
              Picks for
              <br />
              Australian Racing
            </h1>

            <p
              style={{
                color: "#dbeafe",
                fontSize: "20px",
                lineHeight: 1.7,
                marginTop: "30px",
                maxWidth: "760px",
              }}
            >
              PlaceDash analyses Australian horse races using strict race
              filters, recent form, place history, field size, and confidence
              scoring to highlight disciplined place-racing opportunities.
            </p>

            <div
              style={{
                display: "flex",
                gap: "18px",
                marginTop: "34px",
              }}
            >
              <a
                href="/dashboard"
                style={{
                  background: "#22c55e",
                  color: "#07111f",
                  padding: "18px 30px",
                  borderRadius: "18px",
                  textDecoration: "none",
                  fontWeight: 900,
                  fontSize: "18px",
                }}
              >
                View Today’s Best Picks
              </a>

              <a
                href="#method"
                style={{
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#ffffff",
                  padding: "18px 30px",
                  borderRadius: "18px",
                  textDecoration: "none",
                  fontWeight: 800,
                  fontSize: "18px",
                  backdropFilter: "blur(10px)",
                }}
              >
                See The PlaceDash Method
              </a>
            </div>
          </div>

          <div
            style={{
              background: "rgba(15,23,42,0.58)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "30px",
              padding: "34px",
              backdropFilter: "blur(14px)",
            }}
          >
            <div
              style={{
                color: "#22c55e",
                fontWeight: 900,
                letterSpacing: "0.14em",
                marginBottom: "18px",
              }}
            >
              TODAY’S SNAPSHOT
            </div>

            <h2
              style={{
                color: "#ffffff",
                fontSize: "44px",
                margin: 0,
                marginBottom: "26px",
              }}
            >
              Filtered Race Card
            </h2>

            <div
              style={{
                background: "rgba(2,8,18,0.55)",
                borderRadius: "22px",
                padding: "24px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#ffffff",
                      fontWeight: 800,
                      fontSize: "28px",
                    }}
                  >
                    Quirindi Race 1
                  </div>

                  <div
                    style={{
                      color: "#cbd5e1",
                      marginTop: "8px",
                    }}
                  >
                    12:50 pm • 10 active runners
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.4)",
                    color: "#ffffff",
                    fontWeight: 800,
                  }}
                >
                  PREVIEW
                </div>
              </div>

              <div
                style={{
                  marginTop: "26px",
                  color: "#dbeafe",
                  fontSize: "18px",
                }}
              >
                Top Rated:
              </div>

              <div
                style={{
                  marginTop: "8px",
                  color: "#86efac",
                  fontWeight: 900,
                  fontSize: "42px",
                }}
              >
                Devilish Sun
              </div>
            </div>

            <div
              style={{
                marginTop: "22px",
                color: "#cbd5e1",
                lineHeight: 1.6,
                fontSize: "18px",
              }}
            >
              Preview example only. Official AI selections appear inside the
              live dashboard.
            </div>
          </div>
        </section>

        <section
          style={{
            padding: "90px 24px 110px",
            textAlign: "center",
            backgroundImage:
              'linear-gradient(rgba(2,8,18,0.84), rgba(2,8,18,0.9)), url("/raceday.png")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div
              style={{
                color: "#22c55e",
                fontSize: "14px",
                fontWeight: 900,
                letterSpacing: "0.14em",
                marginBottom: "18px",
              }}
            >
              TODAY&apos;S PREDICTIONS
            </div>

            <h2
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize: "48px",
                lineHeight: 1.08,
                letterSpacing: "-1.5px",
              }}
            >
              Qualifying races appear inside the live dashboard
            </h2>

            <p
              style={{
                maxWidth: "850px",
                margin: "22px auto 0",
                color: "#dbeafe",
                fontSize: "18px",
                lineHeight: 1.7,
              }}
            >
              PlaceDash only displays Australian races that pass the platform
              filters: 8–11 active runners, no first starters, and runners with
              previous race experience.
            </p>

            <a
              href="/dashboard"
              style={{
                display: "inline-block",
                marginTop: "28px",
                background: "#20c865",
                color: "#07111f",
                padding: "18px 34px",
                borderRadius: "16px",
                fontWeight: 900,
                fontSize: "18px",
                textDecoration: "none",
                boxShadow: "0 16px 35px rgba(32,200,101,0.35)",
              }}
            >
              Open Live Dashboard
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
