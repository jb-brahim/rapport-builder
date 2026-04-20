import Citation from '../models/Citation.js';
import Rapport from '../models/Rapport.js';

// @desc    Add a citation
// @route   POST /api/citations
// @access  Private
const addCitation = async (req, res) => {
  try {
    const { rapportId, type, format, data } = req.body;

    const rapport = await Rapport.findById(rapportId);
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });

    // Format Logic (Simple for now)
    let fullRef = '';
    let shortLabel = '';

    if (format === 'APA') {
      const authors = data.authors?.join(', ') || 'Auteur Inconnu';
      fullRef = `${authors} (${data.year || 'n.d.'}). ${data.title}. ${data.publisher || data.journal || ''}`;
      shortLabel = `(${data.authors?.[0] || 'Anon'}, ${data.year || 'n.d.'})`;
    } else {
      // IEEE style
      const count = await Citation.countDocuments({ rapportId });
      shortLabel = `[${count + 1}]`;
      fullRef = `${data.authors?.join(', ')}, "${data.title}," ${data.journal || data.publisher}, ${data.year}.`;
    }

    const citation = new Citation({
      rapportId,
      type,
      format,
      data,
      shortLabel,
      fullReference: fullRef
    });

    const createdCitation = await citation.save();
    res.status(201).json(createdCitation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get citations for a rapport
// @route   GET /api/citations/:rapportId
// @access  Private
const getCitationsByRapport = async (req, res) => {
  try {
    const { rapportId } = req.params;
    const citations = await Citation.find({ rapportId }).sort({ createdAt: 1 });
    res.json(citations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a citation
// @route   DELETE /api/citations/:id
// @access  Private
const deleteCitation = async (req, res) => {
  try {
    const citation = await Citation.findById(req.params.id);
    if (!citation) return res.status(404).json({ message: 'Citation not found' });
    await citation.deleteOne();
    res.json({ message: 'Citation deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { addCitation, getCitationsByRapport, deleteCitation };
