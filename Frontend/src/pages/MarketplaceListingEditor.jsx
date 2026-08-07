import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import { useT } from "../lib/i18n.jsx";
import { api } from "../lib/api/client.js";

export default function MarketplaceListingEditor() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("TRANSLATION");
  const [cefrLevel, setCefrLevel] = useState("B1");
  const [price, setPrice] = useState("0.00");
  const [pricingType, setPricingType] = useState("hr");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const fetchService = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/lingo/services/${id}`);
          setTitle(res.title);
          setDescription(res.description);
          setCategory(res.category);
          setCefrLevel(res.cefr_level || "B1");
          setPrice(res.price);
          setPricingType(res.pricing_type);
          setStatus(res.status);
        } catch (err) {
          console.error("Error loading service listing:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchService();
    }
  }, [id, isEdit]);

  const handleSubmit = async (targetStatus) => {
    if (!title.trim() || !description.trim()) {
      alert("Please fill in the title and description fields.");
      return;
    }

    try {
      const payload = {
        title,
        description,
        category,
        cefr_level: cefrLevel || null,
        price: parseFloat(price) || 0.0,
        pricing_type: pricingType,
        status: targetStatus || status
      };

      if (isEdit) {
        await api.patch(`/lingo/services/${id}`, payload);
      } else {
        await api.post("/lingo/services", payload);
      }
      navigate("/marketplace/services");
    } catch (err) {
      console.error("Error saving listing:", err);
      alert("Failed to save service listing.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Icon name="sync" className="animate-spin text-4xl text-[#E32652]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Editor Controls top bar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b-2 border-black dark:border-stone-800 pb-6 gap-4">
        <div>
          <span className="text-[10px] tracking-widest font-black uppercase text-[#E32652] dark:text-[#f43f5e] font-label">
            LISTINGS COMPOSER
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-black text-black dark:text-white uppercase leading-none tracking-tighter mt-1">
            {isEdit ? "Edit Listing" : "Create Listing"}
          </h1>
          <p className="text-gray-500 dark:text-stone-400 text-sm mt-2 max-w-xl font-sans font-medium">
            Detail your linguistic service, tutoring structure, or translation packages for the marketplace.
          </p>
        </div>

        {/* Composer action button deck */}
        <div className="flex gap-2.5">
          <Link
            to="/marketplace/services"
            className="px-4 py-2 border-2 border-black bg-white dark:bg-stone-800 text-black dark:text-stone-200 font-label text-xs uppercase font-bold shadow-[2px_2px_0px_#000]"
          >
            Cancel
          </Link>
          <button
            onClick={() => handleSubmit("draft")}
            className="px-4 py-2 border-2 border-black bg-[#FAF8F5] dark:bg-stone-800 text-black dark:text-stone-200 font-label text-xs uppercase font-bold shadow-[2px_2px_0px_#000] hover:bg-[#FDE2B6] transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit("active")}
            className="px-4 py-2 border-2 border-black bg-[#E32652] hover:bg-[#c11c42] text-white font-label text-xs uppercase font-bold shadow-[2px_2px_0px_#000]"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Two Column Form Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Core Description fields (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#3a3a3a] space-y-6">
          
          {/* Listing Title field */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-black uppercase text-black dark:text-stone-200 font-label">
              <span className="w-1.5 h-1.5 bg-[#E32652]" /> Listing Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Professional Technical Translation EN to FR"
              className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-stone-850 border-2 border-black dark:border-stone-700 text-black dark:text-stone-100 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-[#E32652]"
            />
          </div>

          {/* Description Markdown editor area */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-black uppercase text-black dark:text-stone-200 font-label">
              <span className="w-1.5 h-1.5 bg-[#E32652]" /> Detailed Description
            </label>
            <textarea
              rows="8"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your methodology, experience, translation credentials, and what client requirements are..."
              maxLength="2000"
              className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-stone-850 border-2 border-black dark:border-stone-700 text-black dark:text-stone-100 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-[#E32652]"
            />
            <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-stone-500 font-medium">
              <span>Supports basic Markdown formatting</span>
              <span>{description.length}/2000 characters</span>
            </div>
          </div>
        </div>

        {/* Right Column: Parameters and Covers block (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#3a3a3a] space-y-6 h-fit">
          
          {/* Category Dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest block">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs font-bold bg-[#FAF8F5] dark:bg-stone-800 border-2 border-black dark:border-stone-700 p-2 text-black dark:text-stone-200 focus:outline-none"
            >
              <option value="KOREAN">KOREAN</option>
              <option value="FRENCH">FRENCH</option>
              <option value="SPANISH">SPANISH</option>
              <option value="TRANSLATION">TRANSLATION</option>
              <option value="EDITING">EDITING</option>
            </select>
          </div>

          {/* CEFR Level selection */}
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-stone-800">
            <label className="text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest block">
              CEFR Level
            </label>
            <select
              value={cefrLevel}
              onChange={(e) => setCefrLevel(e.target.value)}
              className="w-full text-xs font-bold bg-[#FAF8F5] dark:bg-stone-800 border-2 border-black dark:border-stone-700 p-2 text-black dark:text-stone-200 focus:outline-none"
            >
              <option value="A1">A1 - BEGINNER</option>
              <option value="A2">A2 - ELEMENTARY</option>
              <option value="B1">B1 - INTERMEDIATE</option>
              <option value="B2">B2 - UPPER INTERMEDIATE</option>
              <option value="C1">C1 - ADVANCED</option>
              <option value="C2">C2 - PROFICIENT</option>
            </select>
          </div>

          {/* Pricing parameters */}
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-stone-800">
            <label className="text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest block">
              Base Price & Rate Type
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex border-2 border-black dark:border-stone-750 bg-[#FAF8F5] dark:bg-stone-850">
                <span className="px-2 py-1.5 text-xs text-gray-400 dark:text-stone-500 font-mono">TJS</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-2 py-1.5 bg-transparent border-0 text-black dark:text-stone-100 text-xs font-mono focus:outline-none"
                />
              </div>

              <select
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value)}
                className="w-24 text-xs font-bold bg-[#FAF8F5] dark:bg-stone-800 border-2 border-black dark:border-stone-700 p-2 text-black dark:text-stone-200"
              >
                <option value="hr">/ hour</option>
                <option value="doc">/ doc</option>
                <option value="word">/ word</option>
              </select>
            </div>
          </div>

          {/* Portfolio Cover Upload drag zone */}
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-stone-800">
            <label className="text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest block">
              Portfolio Media
            </label>
            <div className="border-2 border-dashed border-black dark:border-stone-700 p-6 text-center bg-[#FAF8F5] dark:bg-stone-950/20 cursor-pointer hover:bg-stone-100/50 dark:hover:bg-stone-850/30 transition-all flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-[#FDE2B6] border border-black flex items-center justify-center">
                <Icon name="upload" className="text-black" />
              </div>
              <span className="text-[11px] font-bold text-black dark:text-stone-200 uppercase">
                Upload Covers or Samples
              </span>
              <span className="text-[9px] text-gray-400 dark:text-stone-500">
                JPG, PNG, PDF up to 10MB
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
