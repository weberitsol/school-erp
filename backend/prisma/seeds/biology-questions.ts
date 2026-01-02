// Biology Class 11 - Comprehensive Question Bank
// Based on NCERT syllabus with NEET style questions

export const BIOLOGY_QUESTIONS = {
  // Chapter 1: The Living World
  chapter1: [
    { questionText: 'The basic unit of classification is:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Genus' }, { id: 'b', text: 'Species' }, { id: 'c', text: 'Family' }, { id: 'd', text: 'Order' }], correctAnswer: 'b', answerExplanation: 'Species is the basic unit of classification and taxonomic hierarchy.', marks: 4, negativeMarks: 1, topic: 'Taxonomy' },
    { questionText: 'Binomial nomenclature was given by:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Darwin' }, { id: 'b', text: 'Linnaeus' }, { id: 'c', text: 'Mendel' }, { id: 'd', text: 'Lamarck' }], correctAnswer: 'b', answerExplanation: 'Carolus Linnaeus introduced binomial nomenclature system.', marks: 4, negativeMarks: 1, topic: 'Taxonomy' },
    { questionText: 'Which is NOT a characteristic of living organisms?', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Growth' }, { id: 'b', text: 'Reproduction' }, { id: 'c', text: 'Decay' }, { id: 'd', text: 'Response to stimuli' }], correctAnswer: 'c', answerExplanation: 'Decay is not a characteristic of living organisms; it occurs after death.', marks: 4, negativeMarks: 1, topic: 'Characteristics of Living' },
    { questionText: 'Correct sequence of taxonomic categories is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Kingdom-Phylum-Class-Order-Family-Genus-Species' }, { id: 'b', text: 'Kingdom-Phylum-Order-Class-Family-Genus-Species' }, { id: 'c', text: 'Species-Genus-Family-Order-Class-Phylum-Kingdom' }, { id: 'd', text: 'Kingdom-Class-Phylum-Order-Family-Genus-Species' }], correctAnswer: 'a', answerExplanation: 'King Philip Came Over For Good Soup - mnemonic for hierarchy.', marks: 4, negativeMarks: 1, topic: 'Taxonomic Hierarchy' },
    { questionText: 'ICBN stands for:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'International Code of Botanical Nomenclature' }, { id: 'b', text: 'International Code of Biological Nomenclature' }, { id: 'c', text: 'Indian Code of Botanical Nomenclature' }, { id: 'd', text: 'International Code of Bacteriological Nomenclature' }], correctAnswer: 'a', answerExplanation: 'ICBN governs plant nomenclature (now called ICN).', marks: 4, negativeMarks: 1, topic: 'Nomenclature' },
    { questionText: 'Number of taxonomic categories in hierarchy:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 7, answerExplanation: 'Kingdom, Phylum, Class, Order, Family, Genus, Species = 7 obligate categories', marks: 4, negativeMarks: 0, topic: 'Taxonomic Hierarchy' },
    { questionText: 'Which are characteristics of life?', questionType: 'MULTIPLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Metabolism' }, { id: 'b', text: 'Reproduction' }, { id: 'c', text: 'Organization' }, { id: 'd', text: 'Crystallization' }], correctOptions: ['a', 'b', 'c'], answerExplanation: 'Crystallization is a property of non-living things, not life.', marks: 4, negativeMarks: 2, topic: 'Characteristics of Living' },
    { questionText: 'Assertion: Species is the basic unit of classification.\nReason: Species share common ancestry and can interbreed.', questionType: 'ASSERTION_REASONING', difficulty: 'MEDIUM', assertionData: { assertion: 'Species is the basic unit of classification.', reason: 'Members of same species can interbreed and produce fertile offspring.', correctOption: 'a' }, answerExplanation: 'Both true; interbreeding capability defines a species.', marks: 4, negativeMarks: 1, topic: 'Taxonomy' },
  ],

  // Chapter 2: Biological Classification
  chapter2: [
    { questionText: 'Five kingdom classification was proposed by:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Linnaeus' }, { id: 'b', text: 'Whittaker' }, { id: 'c', text: 'Haeckel' }, { id: 'd', text: 'Copeland' }], correctAnswer: 'b', answerExplanation: 'R.H. Whittaker (1969) proposed five kingdom classification.', marks: 4, negativeMarks: 1, topic: 'Classification Systems' },
    { questionText: 'Bacteria belong to kingdom:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Monera' }, { id: 'b', text: 'Protista' }, { id: 'c', text: 'Fungi' }, { id: 'd', text: 'Plantae' }], correctAnswer: 'a', answerExplanation: 'Bacteria are prokaryotes belonging to kingdom Monera.', marks: 4, negativeMarks: 1, topic: 'Kingdom Monera' },
    { questionText: 'Mushroom belongs to:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Plantae' }, { id: 'b', text: 'Fungi' }, { id: 'c', text: 'Protista' }, { id: 'd', text: 'Monera' }], correctAnswer: 'b', answerExplanation: 'Mushrooms are basidiomycete fungi.', marks: 4, negativeMarks: 1, topic: 'Kingdom Fungi' },
    { questionText: 'Viruses are considered living because they:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Can multiply outside host' }, { id: 'b', text: 'Can replicate inside host' }, { id: 'c', text: 'Have cellular structure' }, { id: 'd', text: 'Perform metabolism independently' }], correctAnswer: 'b', answerExplanation: 'Viruses replicate using host cell machinery, showing living characteristic.', marks: 4, negativeMarks: 1, topic: 'Viruses' },
    { questionText: 'Cyanobacteria are also called:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Red algae' }, { id: 'b', text: 'Blue-green algae' }, { id: 'c', text: 'Brown algae' }, { id: 'd', text: 'Green algae' }], correctAnswer: 'b', answerExplanation: 'Cyanobacteria were earlier called blue-green algae due to pigmentation.', marks: 4, negativeMarks: 1, topic: 'Kingdom Monera' },
    { questionText: 'Number of kingdoms in Whittaker\'s classification:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 5, answerExplanation: 'Monera, Protista, Fungi, Plantae, Animalia = 5 kingdoms', marks: 4, negativeMarks: 0, topic: 'Classification' },
    { questionText: 'Which are prokaryotic?', questionType: 'MULTIPLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Bacteria' }, { id: 'b', text: 'Cyanobacteria' }, { id: 'c', text: 'Mycoplasma' }, { id: 'd', text: 'Amoeba' }], correctOptions: ['a', 'b', 'c'], answerExplanation: 'Amoeba is a eukaryotic protist.', marks: 4, negativeMarks: 2, topic: 'Kingdom Monera' },
  ],

  // Chapter 3: Plant Kingdom
  chapter3: [
    { questionText: 'Bryophytes are called amphibians of plant kingdom because:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'They live in water' }, { id: 'b', text: 'They need water for sexual reproduction' }, { id: 'c', text: 'They live on land and water' }, { id: 'd', text: 'They have both roots and no roots' }], correctAnswer: 'b', answerExplanation: 'Bryophytes need water for fertilization (swimming sperms), hence amphibians.', marks: 4, negativeMarks: 1, topic: 'Bryophytes' },
    { questionText: 'Dominant phase in pteridophytes is:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Gametophyte' }, { id: 'b', text: 'Sporophyte' }, { id: 'c', text: 'Both equal' }, { id: 'd', text: 'None' }], correctAnswer: 'b', answerExplanation: 'In pteridophytes, sporophyte (2n) is dominant and independent.', marks: 4, negativeMarks: 1, topic: 'Pteridophytes' },
    { questionText: 'Seeds are found in:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Bryophytes' }, { id: 'b', text: 'Pteridophytes' }, { id: 'c', text: 'Gymnosperms' }, { id: 'd', text: 'Algae' }], correctAnswer: 'c', answerExplanation: 'Gymnosperms are seed-bearing plants (naked seeds).', marks: 4, negativeMarks: 1, topic: 'Gymnosperms' },
    { questionText: 'Double fertilization occurs in:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Bryophytes' }, { id: 'b', text: 'Pteridophytes' }, { id: 'c', text: 'Gymnosperms' }, { id: 'd', text: 'Angiosperms' }], correctAnswer: 'd', answerExplanation: 'Double fertilization is unique to angiosperms.', marks: 4, negativeMarks: 1, topic: 'Angiosperms' },
    { questionText: 'Which group shows alternation of generations?', questionType: 'MULTIPLE_CORRECT', difficulty: 'HARD', options: [{ id: 'a', text: 'Algae' }, { id: 'b', text: 'Bryophytes' }, { id: 'c', text: 'Pteridophytes' }, { id: 'd', text: 'All plants' }], correctOptions: ['a', 'b', 'c', 'd'], answerExplanation: 'All plants show alternation of generations between gametophyte and sporophyte.', marks: 4, negativeMarks: 2, topic: 'Life Cycles' },
  ],

  // Chapter 4: Animal Kingdom
  chapter4: [
    { questionText: 'Which phylum has cnidocytes?', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Porifera' }, { id: 'b', text: 'Cnidaria' }, { id: 'c', text: 'Platyhelminthes' }, { id: 'd', text: 'Annelida' }], correctAnswer: 'b', answerExplanation: 'Cnidaria have cnidocytes (stinging cells) - unique to this phylum.', marks: 4, negativeMarks: 1, topic: 'Cnidaria' },
    { questionText: 'True coelom is found in:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Annelida' }, { id: 'b', text: 'Platyhelminthes' }, { id: 'c', text: 'Nematoda' }, { id: 'd', text: 'Porifera' }], correctAnswer: 'a', answerExplanation: 'Annelida are true coelomates with mesoderm-lined body cavity.', marks: 4, negativeMarks: 1, topic: 'Body Cavity' },
    { questionText: 'Jointed legs are characteristic of:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Mollusca' }, { id: 'b', text: 'Arthropoda' }, { id: 'c', text: 'Annelida' }, { id: 'd', text: 'Echinodermata' }], correctAnswer: 'b', answerExplanation: 'Arthropoda literally means "jointed legs".', marks: 4, negativeMarks: 1, topic: 'Arthropoda' },
    { questionText: 'Chordates are characterized by:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Dorsal nerve cord' }, { id: 'b', text: 'Ventral nerve cord' }, { id: 'c', text: 'No nerve cord' }, { id: 'd', text: 'Ladder-like nervous system' }], correctAnswer: 'a', answerExplanation: 'Chordates have dorsal hollow nerve cord, notochord, and pharyngeal gill slits.', marks: 4, negativeMarks: 1, topic: 'Chordata' },
    { questionText: 'Number of legs in insects:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 6, answerExplanation: 'Insects have 3 pairs = 6 legs (hexapods).', marks: 4, negativeMarks: 0, topic: 'Arthropoda' },
  ],

  // Chapter 8: Cell - The Unit of Life
  chapter8: [
    { questionText: 'Cell theory was proposed by:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Robert Hooke' }, { id: 'b', text: 'Schleiden and Schwann' }, { id: 'c', text: 'Virchow' }, { id: 'd', text: 'Leeuwenhoek' }], correctAnswer: 'b', answerExplanation: 'Schleiden (1838) and Schwann (1839) proposed cell theory.', marks: 4, negativeMarks: 1, topic: 'Cell Theory' },
    { questionText: 'Mitochondria is called powerhouse because:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'It stores energy' }, { id: 'b', text: 'It produces ATP' }, { id: 'c', text: 'It has DNA' }, { id: 'd', text: 'It divides' }], correctAnswer: 'b', answerExplanation: 'Mitochondria produce ATP through oxidative phosphorylation.', marks: 4, negativeMarks: 1, topic: 'Mitochondria' },
    { questionText: 'Rough ER has:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Mitochondria' }, { id: 'b', text: 'Ribosomes' }, { id: 'c', text: 'Golgi' }, { id: 'd', text: 'Lysosomes' }], correctAnswer: 'b', answerExplanation: 'Rough ER is studded with ribosomes for protein synthesis.', marks: 4, negativeMarks: 1, topic: 'Endoplasmic Reticulum' },
    { questionText: 'Suicide bags of the cell are:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Ribosomes' }, { id: 'b', text: 'Lysosomes' }, { id: 'c', text: 'Peroxisomes' }, { id: 'd', text: 'Golgi bodies' }], correctAnswer: 'b', answerExplanation: 'Lysosomes contain hydrolytic enzymes that can digest the cell itself.', marks: 4, negativeMarks: 1, topic: 'Lysosomes' },
    { questionText: 'Number of membrane layers in nuclear envelope:', questionType: 'INTEGER_TYPE', difficulty: 'EASY', integerAnswer: 2, answerExplanation: 'Nuclear envelope is double-membrane structure.', marks: 4, negativeMarks: 0, topic: 'Nucleus' },
    { questionText: 'Which organelles have their own DNA?', questionType: 'MULTIPLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Mitochondria' }, { id: 'b', text: 'Chloroplast' }, { id: 'c', text: 'Ribosome' }, { id: 'd', text: 'Golgi body' }], correctOptions: ['a', 'b'], answerExplanation: 'Only mitochondria and chloroplasts have their own circular DNA.', marks: 4, negativeMarks: 2, topic: 'Cell Organelles' },
  ],

  // Chapter 10: Cell Cycle and Cell Division
  chapter10: [
    { questionText: 'S phase of cell cycle involves:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: 'Cell division' }, { id: 'b', text: 'DNA replication' }, { id: 'c', text: 'Protein synthesis' }, { id: 'd', text: 'Organelle division' }], correctAnswer: 'b', answerExplanation: 'S (Synthesis) phase is when DNA replicates.', marks: 4, negativeMarks: 1, topic: 'Cell Cycle' },
    { questionText: 'Crossing over occurs in:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Prophase I' }, { id: 'b', text: 'Metaphase I' }, { id: 'c', text: 'Anaphase I' }, { id: 'd', text: 'Prophase II' }], correctAnswer: 'a', answerExplanation: 'Crossing over occurs during pachytene stage of prophase I.', marks: 4, negativeMarks: 1, topic: 'Meiosis' },
    { questionText: 'Meiosis results in:', questionType: 'SINGLE_CORRECT', difficulty: 'EASY', options: [{ id: 'a', text: '2 diploid cells' }, { id: 'b', text: '4 diploid cells' }, { id: 'c', text: '2 haploid cells' }, { id: 'd', text: '4 haploid cells' }], correctAnswer: 'd', answerExplanation: 'Meiosis produces 4 haploid cells from one diploid cell.', marks: 4, negativeMarks: 1, topic: 'Meiosis' },
    { questionText: 'Spindle fibres attach to chromosomes at:', questionType: 'SINGLE_CORRECT', difficulty: 'MEDIUM', options: [{ id: 'a', text: 'Centromere' }, { id: 'b', text: 'Telomere' }, { id: 'c', text: 'Chromatin' }, { id: 'd', text: 'Chromatid' }], correctAnswer: 'a', answerExplanation: 'Kinetochore at centromere is attachment site for spindle fibres.', marks: 4, negativeMarks: 1, topic: 'Mitosis' },
    { questionText: 'Number of chromatids in a chromosome at metaphase:', questionType: 'INTEGER_TYPE', difficulty: 'MEDIUM', integerAnswer: 2, answerExplanation: 'At metaphase, each chromosome has 2 sister chromatids joined at centromere.', marks: 4, negativeMarks: 0, topic: 'Mitosis' },
  ],
};

export function getAllBiologyQuestions() {
  const allQuestions: any[] = [];

  Object.entries(BIOLOGY_QUESTIONS).forEach(([chapter, questions]) => {
    const chapterNum = parseInt(chapter.replace('chapter', ''));
    questions.forEach((q) => {
      allQuestions.push({
        ...q,
        chapterNumber: chapterNum,
        source: 'NCERT',
      });
    });
  });

  return allQuestions;
}

export default BIOLOGY_QUESTIONS;
