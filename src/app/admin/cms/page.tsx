"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageContent {
  id: string;
  page: string;
  section: string;
  title: string;
  content: string;
}

export default function CmsPage() {
  const [pages, setPages] = useState<PageContent[]>([
    {
      id: "1",
      page: "Home",
      section: "Hero Title",
      title: "Building Trust, One Property at a Time",
      content: "Exceptional property services, advisory, and management delivered with precision."
    },
    {
      id: "2",
      page: "Services",
      section: "Section Title",
      title: "Our Services",
      content: "Comprehensive real estate solutions tailored to your needs."
    }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PageContent | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (item: PageContent) => {
    setEditingId(item.id);
    setFormData(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setPages(pages.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    if (!formData) return;

    if (editingId) {
      setPages(pages.map((p) => (p.id === editingId ? formData : p)));
    } else {
      setPages([...pages, { ...formData, id: Date.now().toString() }]);
    }

    setEditingId(null);
    setFormData(null);
    setShowForm(false);
  };

  const handleNew = () => {
    setFormData({
      id: "",
      page: "Home",
      section: "New Section",
      title: "",
      content: ""
    });
    setEditingId(null);
    setShowForm(true);
  };

  return (
    <div className="container-wide space-y-8 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900">CMS Dashboard</h1>
          <p className="text-slateInk mt-2">Manage your website content easily</p>
        </div>
        <Button onClick={handleNew} size="lg" variant="primary" className="gap-2">
          <Plus className="h-4 w-4" />
          New Content
        </Button>
      </div>

      {/* Content Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-6 border border-white/60"
        >
          <h2 className="text-2xl font-black text-slate-900 mb-6">
            {editingId ? "Edit Content" : "Create New Content"}
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="page">Page</Label>
                <Input
                  id="page"
                  value={formData?.page || ""}
                  onChange={(e) => setFormData({ ...formData!, page: e.target.value })}
                  placeholder="e.g., Home, Services"
                />
              </div>
              <div>
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={formData?.section || ""}
                  onChange={(e) => setFormData({ ...formData!, section: e.target.value })}
                  placeholder="e.g., Hero, Services"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData?.title || ""}
                onChange={(e) => setFormData({ ...formData!, title: e.target.value })}
                placeholder="Content title"
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData?.content || ""}
                onChange={(e) => setFormData({ ...formData!, content: e.target.value })}
                placeholder="Content description"
                className="min-h-32"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} variant="primary" className="gap-2">
                <Save className="h-4 w-4" />
                Save Content
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content List */}
      <div className="grid gap-4">
        {pages.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border border-white/60 hover:shadow-glow transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-royal/10 text-royal">
                        {item.page}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple/10 text-purple">
                        {item.section}
                      </span>
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(item)}
                      className="gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      className="gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slateInk">{item.content}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {pages.length === 0 && !showForm && (
        <div className="text-center py-12">
          <p className="text-slateInk mb-4">No content yet. Create your first piece!</p>
          <Button onClick={handleNew} variant="primary">
            Create Content
          </Button>
        </div>
      )}
    </div>
  );
}
