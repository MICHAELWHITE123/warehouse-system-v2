import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { MapPin, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { locationService } from "../database/services";
import type { DbLocation } from "../database/types";

export function LocationManagement() {
  const [locations, setLocations] = useState<DbLocation[]>([]);
  const [newLocation, setNewLocation] = useState("");
  const [editingLocation, setEditingLocation] = useState<DbLocation | null>(null);
  const [editValue, setEditValue] = useState("");
  const [equipmentCount, setEquipmentCount] = useState<{ [locationId: number]: number }>({});

  // Загрузка местоположений и подсчет оборудования
  const loadLocations = () => {
    try {
      const data = locationService.getAllLocations();
      setLocations(data);
      
      // Подсчитываем количество оборудования для каждого местоположения
      const counts: { [locationId: number]: number } = {};
      data.forEach(location => {
        counts[location.id] = locationService.getEquipmentCountByLocation(location.id);
      });
      setEquipmentCount(counts);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Ошибка загрузки местоположений');
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleAddLocation = () => {
    if (!newLocation.trim()) {
      toast.error("Введите название местоположения");
      return;
    }

    if (locations.some(loc => loc.name === newLocation.trim())) {
      toast.error("Такое местоположение уже существует");
      return;
    }

    try {
      locationService.createLocation({
        name: newLocation.trim(),
        description: "",
        address: ""
      });
      setNewLocation("");
      loadLocations(); // Перезагружаем данные
      toast.success("Местоположение добавлено");
    } catch (error) {
      console.error('Error creating location:', error);
      toast.error('Ошибка создания местоположения');
    }
  };

  const handleEditLocation = (location: DbLocation) => {
    setEditingLocation(location);
    setEditValue(location.name);
  };

  const handleSaveEdit = () => {
    if (!editValue.trim()) {
      toast.error("Введите название местоположения");
      return;
    }

    if (!editingLocation) return;

    if (editValue.trim() !== editingLocation.name && 
        locations.some(loc => loc.name === editValue.trim())) {
      toast.error("Такое местоположение уже существует");
      return;
    }

    try {
      locationService.updateLocation(editingLocation.id, {
        name: editValue.trim(),
        description: editingLocation.description || "",
        address: editingLocation.address || ""
      });
      setEditingLocation(null);
      setEditValue("");
      loadLocations(); // Перезагружаем данные
      toast.success("Местоположение обновлено");
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Ошибка обновления местоположения');
    }
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
    setEditValue("");
  };

  const handleDeleteLocation = (location: DbLocation) => {
    const count = equipmentCount[location.id] || 0;
    
    if (count > 0) {
      toast.error(`Нельзя удалить местоположение "${location.name}". В нем находится ${count} единиц техники.`);
      return;
    }

    try {
      locationService.deleteLocation(location.id);
      loadLocations(); // Перезагружаем данные
      toast.success("Местоположение удалено");
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Ошибка удаления местоположения');
    }
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
                <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {editingLocation?.id === location.id ? (
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
                        <span className="flex-1">{location.name}</span>
                        <Badge variant="secondary">
                          {equipmentCount[location.id] || 0} единиц
                        </Badge>
                      </>
                    )}
                  </div>
                  
                  {editingLocation?.id !== location.id && (
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
                        disabled={equipmentCount[location.id] > 0}
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
              const count = equipmentCount[location.id] || 0;
              return (
                <div key={location.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{location.name}</span>
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