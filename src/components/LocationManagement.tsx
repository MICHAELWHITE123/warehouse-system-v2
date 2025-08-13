import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { MapPin, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface LocationManagementProps {
  locations: string[];
  onLocationsChange: (locations: string[]) => void;
  equipmentCount: { [location: string]: number };
}

export function LocationManagement({ locations, onLocationsChange, equipmentCount }: LocationManagementProps) {
  const [newLocation, setNewLocation] = useState("");
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAddLocation = () => {
    if (!newLocation.trim()) {
      toast.error("Введите название местоположения");
      return;
    }

    if (locations.includes(newLocation.trim())) {
      toast.error("Такое местоположение уже существует");
      return;
    }

    onLocationsChange([...locations, newLocation.trim()]);
    setNewLocation("");
    toast.success("Местоположение добавлено");
  };

  const handleEditLocation = (location: string) => {
    setEditingLocation(location);
    setEditValue(location);
  };

  const handleSaveEdit = () => {
    if (!editValue.trim()) {
      toast.error("Введите название местоположения");
      return;
    }

    if (editValue.trim() !== editingLocation && locations.includes(editValue.trim())) {
      toast.error("Такое местоположение уже существует");
      return;
    }

    const updatedLocations = locations.map(loc => 
      loc === editingLocation ? editValue.trim() : loc
    );
    onLocationsChange(updatedLocations);
    setEditingLocation(null);
    setEditValue("");
    toast.success("Местоположение обновлено");
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
    setEditValue("");
  };

  const handleDeleteLocation = (location: string) => {
    const count = equipmentCount[location] || 0;
    
    if (count > 0) {
      toast.error(`Нельзя удалить местоположение "${location}". В нем находится ${count} единиц техники.`);
      return;
    }

    onLocationsChange(locations.filter(loc => loc !== location));
    toast.success("Местоположение удалено");
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'add' | 'edit') => {
    if (e.key === 'Enter') {
      if (action === 'add') {
        handleAddLocation();
      } else {
        handleSaveEdit();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-6 w-6" />
        <h1>Управление местоположениями</h1>
      </div>

      {/* Добавление нового местоположения */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Добавить местоположение
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="new-location">Название местоположения</Label>
              <Input
                id="new-location"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Например, Склад C"
                onKeyPress={(e) => handleKeyPress(e, 'add')}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddLocation}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список местоположений */}
      <Card>
        <CardHeader>
          <CardTitle>Текущие местоположения ({locations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Местоположения не добавлены
            </p>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div key={location} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {editingLocation === location ? (
                      <div className="flex gap-2 flex-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, 'edit')}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1">{location}</span>
                        <Badge variant="secondary">
                          {equipmentCount[location] || 0} единиц
                        </Badge>
                      </>
                    )}
                  </div>
                  
                  {editingLocation !== location && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditLocation(location)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteLocation(location)}
                        disabled={equipmentCount[location] > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Статистика */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика по местоположениям</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => {
              const count = equipmentCount[location] || 0;
              return (
                <div key={location} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{location}</span>
                  </div>
                  <div className="text-2xl font-medium">{count}</div>
                  <div className="text-sm text-muted-foreground">
                    {count === 1 ? 'единица техники' : count < 5 ? 'единицы техники' : 'единиц техники'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}