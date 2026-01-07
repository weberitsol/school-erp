const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");

// Create a proper DOCX file with real content
const zip = new JSZip();

// Add [Content_Types].xml
zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

// Add _rels/.rels
zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

// Add word/document.xml with actual test questions
zip.folder("word").file("document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p>
<w:r>
<w:t>Physics Test - Class 12</w:t>
</w:r>
</w:p>

<w:p>
<w:r>
<w:t>Question 1: What is the SI unit of electric charge?</w:t>
</w:r>
</w:p>
<w:p><w:r><w:t>A) Ampere</w:t></w:r></w:p>
<w:p><w:r><w:t>B) Coulomb</w:t></w:r></w:p>
<w:p><w:r><w:t>C) Farad</w:t></w:r></w:p>
<w:p><w:r><w:t>D) Ohm</w:t></w:r></w:p>
<w:p><w:r><w:t>Answer: B</w:t></w:r></w:p>

<w:p>
<w:r>
<w:t>Question 2: What is the speed of light in vacuum?</w:t>
</w:r>
</w:p>
<w:p><w:r><w:t>A) 2.5 × 10^8 m/s</w:t></w:r></w:p>
<w:p><w:r><w:t>B) 3 × 10^8 m/s</w:t></w:r></w:p>
<w:p><w:r><w:t>C) 4 × 10^8 m/s</w:t></w:r></w:p>
<w:p><w:r><w:t>D) 5 × 10^8 m/s</w:t></w:r></w:p>
<w:p><w:r><w:t>Answer: B</w:t></w:r></w:p>

<w:p>
<w:r>
<w:t>Question 3: What is Newtons second law of motion?</w:t>
</w:r>
</w:p>
<w:p><w:r><w:t>A) F = ma</w:t></w:r></w:p>
<w:p><w:r><w:t>B) F = mv</w:t></w:r></w:p>
<w:p><w:r><w:t>C) F = m/a</w:t></w:r></w:p>
<w:p><w:r><w:t>D) F = a/m</w:t></w:r></w:p>
<w:p><w:r><w:t>Answer: A</w:t></w:r></w:p>

<w:p>
<w:r>
<w:t>Question 4: What is the SI unit of frequency?</w:t>
</w:r>
</w:p>
<w:p><w:r><w:t>A) Hertz</w:t></w:r></w:p>
<w:p><w:r><w:t>B) Joule</w:t></w:r></w:p>
<w:p><w:r><w:t>C) Watt</w:t></w:r></w:p>
<w:p><w:r><w:t>D) Pascal</w:t></w:r></w:p>
<w:p><w:r><w:t>Answer: A</w:t></w:r></w:p>

<w:p>
<w:r>
<w:t>Question 5: What is the formula for kinetic energy?</w:t>
</w:r>
</w:p>
<w:p><w:r><w:t>A) KE = mgh</w:t></w:r></w:p>
<w:p><w:r><w:t>B) KE = (1/2)mv2</w:t></w:r></w:p>
<w:p><w:r><w:t>C) KE = Fd</w:t></w:r></w:p>
<w:p><w:r><w:t>D) KE = qV</w:t></w:r></w:p>
<w:p><w:r><w:t>Answer: B</w:t></w:r></w:p>

</w:body>
</w:document>`);

// Generate DOCX as buffer
zip.generateAsync({type: "nodebuffer"}).then(buffer => {
  const uploadDir = require("path").join(process.cwd(), "uploads", "test-papers");
  if (!require("fs").existsSync(uploadDir)) {
    require("fs").mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = require("path").join(uploadDir, "physics-test-12.docx");
  require("fs").writeFileSync(filePath, buffer);
  console.log("✅ Created DOCX file: physics-test-12.docx");
  console.log("   Location:", filePath);
  console.log("   Size:", (buffer.length / 1024).toFixed(2), "KB");
  console.log("   Content: 5 Physics questions with answers");
}).catch(err => {
  console.error("Error creating DOCX:", err.message);
});
