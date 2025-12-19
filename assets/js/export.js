document.addEventListener("DOMContentLoaded", () => {
  const exportBtn = document.getElementById("exportPDF");

  if (!exportBtn) {
    console.error("❌ Export PDF button not found");
    return;
  }

  exportBtn.addEventListener("click", async () => {
    if (typeof quill === "undefined" || !quill) {
      alert("Editor is not initialized.");
      return;
    }

    const textContent = quill.getText().trim();
    if (textContent.length === 0) {
      alert("⚠️ Document is empty. Please add content first.");
      return;
    }

    exportBtn.disabled = true;
    exportBtn.textContent = "⏳ Exporting...";

    console.log("📄 Starting PDF export...");
    console.log("📄 Content:", textContent);

    let overlay = null;
    let wrapper = null;

    try {
      // Create full-screen white overlay
      overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        z-index: 999998;
      `;
      document.body.appendChild(overlay);

      // Create wrapper centered on screen
      wrapper = document.createElement("div");
      const htmlContent = quill.root.innerHTML;
      wrapper.innerHTML = htmlContent;
      
      wrapper.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        width: 700px;
        padding: 40px;
        background: white;
        color: black;
        font-family: Arial, sans-serif;
        font-size: 16px;
        line-height: 1.8;
        z-index: 999999;
        box-sizing: border-box;
      `;

      // Style all elements with inline styles
      const elements = wrapper.querySelectorAll('*');
      elements.forEach(el => {
        el.style.color = 'black';
        
        if (el.tagName === 'P') {
          el.style.marginBottom = '16px';
          el.style.fontSize = '16px';
        }
        if (el.tagName === 'STRONG' || el.tagName === 'B') {
          el.style.fontWeight = 'bold';
        }
        if (el.tagName === 'EM' || el.tagName === 'I') {
          el.style.fontStyle = 'italic';
        }
        if (el.tagName === 'U') {
          el.style.textDecoration = 'underline';
        }
      });

      document.body.appendChild(wrapper);
      console.log("✅ Content visible on screen");

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("🔄 Capturing with html2canvas...");

      // Use html2canvas directly
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: wrapper.offsetWidth,
        height: wrapper.offsetHeight
      });

      console.log("✅ Canvas created:", canvas.width, "x", canvas.height);

      // Convert canvas to PDF using jsPDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Access jsPDF from window object
      const { jsPDF } = window.jspdf;
      
      // Calculate PDF dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      console.log("📄 Adding image to PDF...");
      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);

      // Save PDF
      const filename = `document_${Date.now()}.pdf`;
      pdf.save(filename);

      console.log("✅ PDF saved:", filename);

      // Cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      document.body.removeChild(wrapper);
      document.body.removeChild(overlay);

      exportBtn.disabled = false;
      exportBtn.textContent = "📄 PDF";

      alert("✅ PDF downloaded successfully!");

    } catch (error) {
      console.error("❌ Export failed:", error);
      alert(`Export failed: ${error.message}`);
      
      if (wrapper && wrapper.parentNode) document.body.removeChild(wrapper);
      if (overlay && overlay.parentNode) document.body.removeChild(overlay);
      
      exportBtn.disabled = false;
      exportBtn.textContent = "📄 PDF";
    }
  });

  console.log("✅ Export listeners attached");
});
