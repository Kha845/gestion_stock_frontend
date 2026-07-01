import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getSale } from "./api/apiVente";
import { formatMoney } from "./store";

const getImageFormat = (path: string) => {
  const ext = path.split(".").pop()?.toUpperCase();

  if (ext === "JPG" || ext === "JPEG") {
    return "JPEG";
  }

  return "PNG";
};


const loadImage = (
  url: string
): Promise<string> => {
  return new Promise(
    (resolve, reject) => {
      const img = new Image();

      // Suppression de img.crossOrigin = "Anonymous"
      // qui déclenchait le blocage CORS

      img.onload = () => {
        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width =
          img.width;

        canvas.height =
          img.height;

        const ctx =
          canvas.getContext(
            "2d"
          );

        if (!ctx) {
          reject(
            new Error(
              "Impossible de charger l'image"
            )
          );
          return;
        }

        ctx.drawImage(
          img,
          0,
          0
        );

        resolve(
          canvas.toDataURL(
            "image/png"
          )
        );
      };

      img.onerror = reject;
      img.src = url;
    }
  );
};

export const printSaleInvoice =
  async (
    saleId:
      | string
      | number,
    download = false
  ) => {
    try {
      const response =
        await getSale(
          saleId
        );

      const sale =
        response.data;

      const store =
        sale.store;

      const customer =
        sale.customer;

      const user =
        sale.user;

      const items =
        sale.items ?? [];

      const doc =
        new jsPDF({
          unit: "mm",
          format: "a4",
        });

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const pageHeight =
        doc.internal.pageSize.getHeight();

      /* ==========================
         LOGO
      ========================== */

      let logoLoaded =
        false;

      const imageFormat = store?.logo
        ? getImageFormat(store.logo)
        : "PNG";

      // On construit une URL relative pour passer par le proxy Vite
      // ce qui évite tout blocage CORS
      const logoUrl =
        store?.logo
          ? store.logo.startsWith("http")
            ? store.logo
            : `/storage/${store.logo}`
          : null;

      if (logoUrl) {
        try {
          const logo =
            await loadImage(
              logoUrl
            );

          doc.addImage(
            logo,
            imageFormat,
            12,
            8,
            24,
            24
          );

          logoLoaded =
            true;
        } catch (
          error
        ) {
          console.error(
            "Erreur chargement logo",
            error
          );
        }
      }

      /* ==========================
         HEADER
      ========================== */

      doc.setFillColor(
        41,
        72,
        125
      );

      doc.rect(
        0,
        0,
        pageWidth,
        45,
        "F"
      );

      doc.setTextColor(
        255,
        255,
        255
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(
        22
      );

      doc.text(
        "FACTURE",
        logoLoaded
          ? 42
          : 14,
        16
      );

      doc.setFontSize(
        10
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        `N° ${sale.number}`,
        logoLoaded
          ? 42
          : 14,
        25
      );

      doc.text(
        `Date : ${new Date(
          sale.date
        ).toLocaleString(
          "fr-FR"
        )}`,
        logoLoaded
          ? 42
          : 14,
        32
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        store?.name ??
          "MAGASIN",
        196,
        12,
        {
          align:
            "right",
        }
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      let infoY = 18;

      if (
        store?.address
      ) {
        doc.text(
          store.address,
          196,
          infoY,
          {
            align:
              "right",
          }
        );

        infoY += 5;
      }

      if (
        store?.phone
      ) {
        doc.text(
          `Tél : ${store.phone}`,
          196,
          infoY,
          {
            align:
              "right",
          }
        );

        infoY += 5;
      }

      if (
        store?.ninea
      ) {
        doc.text(
          `NINEA : ${store.ninea}`,
          196,
          infoY,
          {
            align:
              "right",
          }
        );

        infoY += 5;
      }

      if (
        store?.registre_commerce
      ) {
        doc.text(
          `RC : ${store.registre_commerce}`,
          196,
          infoY,
          {
            align:
              "right",
          }
        );
      }

      doc.setTextColor(
        0,
        0,
        0
      );

      /* ==========================
         CLIENT
      ========================== */

      doc.roundedRect(
        14,
        55,
        82,
        30,
        2,
        2
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "CLIENT",
        18,
        63
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        customer?.name ??
          "Client comptant",
        18,
        72
      );

      if (
        customer?.phone
      ) {
        doc.text(
          `Tél : ${customer.phone}`,
          18,
          79
        );
      }

      /* ==========================
         VENDEUR
      ========================== */

      doc.roundedRect(
        110,
        55,
        86,
        30,
        2,
        2
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "VENDEUR",
        114,
        63
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        user?.full_name ??
          "Non renseigné",
        114,
        72
      );

      doc.text(
        `Paiement : ${
          sale.payment_method ??
          "-"
        }`,
        114,
        79
      );

      /* ==========================
         TABLE ARTICLES
      ========================== */

      autoTable(doc, {
        startY: 95,

        head: [
          [
            "Produit",
            "Qté",
            "PU",
            "Remise",
            "Total",
          ],
        ],

        body: items.map(
          (
            item: any
          ) => [
            item.name,
            item.quantity,
            formatMoney(
              item.unit_price
            ),
            formatMoney(
              item.discount ??
                0
            ),
            formatMoney(
              item.quantity *
                item.unit_price -
                (item.discount ??
                  0)
            ),
          ]
        ),

        headStyles: {
          fillColor: [
            41,
            72,
            125,
          ],
          textColor: [
            255,
            255,
            255,
          ],
          fontStyle:
            "bold",
        },

        alternateRowStyles:
          {
            fillColor: [
              245,
              245,
              245,
            ],
          },

        styles: {
          fontSize: 9,
          cellPadding: 3,
        },

        columnStyles: {
          1: {
            halign:
              "center",
          },
          2: {
            halign:
              "right",
          },
          3: {
            halign:
              "right",
          },
          4: {
            halign:
              "right",
          },
        },
      });

      const finalY =
        (doc as any)
          .lastAutoTable
          .finalY + 10;

      /* ==========================
         TOTAUX
      ========================== */

      doc.roundedRect(
        120,
        finalY,
        76,
        42,
        2,
        2
      );

      doc.setFontSize(
        10
      );

      doc.text(
        "Sous-total",
        125,
        finalY + 8
      );

      doc.text(
        formatMoney(
          sale.subtotal
        ),
        190,
        finalY + 8,
        {
          align:
            "right",
        }
      );

      doc.text(
        "Remise",
        125,
        finalY + 16
      );

      doc.text(
        formatMoney(
          sale.discount
        ),
        190,
        finalY + 16,
        {
          align:
            "right",
        }
      );

      doc.line(
        125,
        finalY + 20,
        190,
        finalY + 20
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(
        13
      );

      doc.text(
        "TOTAL",
        125,
        finalY + 29
      );

      doc.text(
        formatMoney(
          sale.total
        ),
        190,
        finalY + 29,
        {
          align:
            "right",
        }
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(
        10
      );

      doc.text(
        "Payé",
        125,
        finalY + 38
      );

      doc.text(
        formatMoney(
          sale.paid
        ),
        190,
        finalY + 38,
        {
          align:
            "right",
        }
      );

      const reste =
        Number(
          sale.total
        ) -
        Number(
          sale.paid
        );

      if (
        reste > 0
      ) {
        doc.setTextColor(
          220,
          0,
          0
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.text(
          `Reste dû : ${formatMoney(
            reste
          )}`,
          190,
          finalY + 48,
          {
            align:
              "right",
          }
        );

        doc.setTextColor(
          0,
          0,
          0
        );
      }

      /* ==========================
         SIGNATURE
      ========================== */

      const signY =
        Math.max(
          finalY + 65,
          235
        );

      doc.setFontSize(
        10
      );

      doc.text(
        "Signature / Cachet",
        145,
        signY
      );

      doc.line(
        130,
        signY + 25,
        195,
        signY + 25
      );

      /* ==========================
         FOOTER
      ========================== */

      doc.setFontSize(
        9
      );

      doc.setTextColor(
        120,
        120,
        120
      );

      if (
        store?.ninea ||
        store?.registre_commerce
      ) {
        doc.text(
          `NINEA : ${
            store?.ninea ??
            "-"
          } | RC : ${
            store?.registre_commerce ??
            "-"
          }`,
          pageWidth /
            2,
          pageHeight -
            18,
          {
            align:
              "center",
          }
        );
      }

      doc.text(
        "Merci pour votre confiance",
        pageWidth /
          2,
        pageHeight -
          10,
        {
          align:
            "center",
        }
      );

      doc.text(
        `Document généré le ${new Date().toLocaleString(
          "fr-FR"
        )}`,
        pageWidth /
          2,
        pageHeight -
          5,
        {
          align:
            "center",
        }
      );

      /* ==========================
         EXPORT
      ========================== */

      if (
        download
      ) {
        doc.save(
          `Facture-${sale.number}.pdf`
        );
      } else {
        window.open(
          doc.output(
            "bloburl"
          ),
          "_blank"
        );
      }
    } catch (
      error
    ) {
      console.error(
        error
      );

      throw new Error(
        "Impossible de générer la facture"
      );
    }
  };