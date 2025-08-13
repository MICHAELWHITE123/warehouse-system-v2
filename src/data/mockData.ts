import { Equipment } from "../components/EquipmentList";
import { EquipmentStack } from "../components/StackManagement";

export const mockEquipment: Equipment[] = [
  {
    id: "1",
    name: "MacBook Pro 16\"",
    category: "Компьютеры",
    serialNumber: "MBP16-001",
    status: "in-use",
    location: "ИТ-отдел",
    purchaseDate: "2023-01-15",
    lastMaintenance: "2024-06-01",
    assignedTo: "Иванов И.И."
  },
  {
    id: "2", 
    name: "HP LaserJet Pro 400",
    category: "Принтеры",
    serialNumber: "HP400-001",
    status: "available",
    location: "Офис 1",
    purchaseDate: "2022-08-10",
    lastMaintenance: "2024-03-15"
  },
  {
    id: "3",
    name: "Dell UltraSharp 27\"",
    category: "Мониторы", 
    serialNumber: "DELL27-001",
    status: "available",
    location: "ИТ-отдел",
    purchaseDate: "2023-03-20"
  },
  {
    id: "4",
    name: "Cisco SG350-28",
    category: "Сетевое оборудование",
    serialNumber: "CSC28-001", 
    status: "maintenance",
    location: "Склад A",
    purchaseDate: "2022-12-05",
    lastMaintenance: "2024-07-20"
  },
  {
    id: "5",
    name: "iPhone 14 Pro",
    category: "Мобильные устройства",
    serialNumber: "IPH14-001",
    status: "available",
    location: "Склад B",
    purchaseDate: "2023-09-25"
  },
  {
    id: "6",
    name: "Logitech MX Master 3",
    category: "Аксессуары",
    serialNumber: "LGT-MX3-001",
    status: "available",
    location: "ИТ-отдел",
    purchaseDate: "2023-05-10"
  },
  {
    id: "7",
    name: "Apple Magic Keyboard",
    category: "Аксессуары",
    serialNumber: "APL-KB-001",
    status: "available",
    location: "ИТ-отдел",
    purchaseDate: "2023-05-10"
  }
];

export const mockStacks: EquipmentStack[] = [
  {
    id: "1",
    name: "Комплект разработчика",
    description: "Полный набор техники для программиста: ноутбук, монитор и аксессуары",
    equipmentIds: ["1", "3", "6", "7"],
    createdAt: "2024-08-01T10:00:00Z",
    createdBy: "Администратор",
    tags: ["разработка", "программирование", "рабочее место"]
  },
  {
    id: "2", 
    name: "Базовый офисный комплект",
    description: "Минимальный набор техники для офисного работника",
    equipmentIds: ["2", "5"],
    createdAt: "2024-08-05T14:30:00Z",
    createdBy: "Менеджер",
    tags: ["офис", "базовый комплект"]
  }
];

export const mockShipments = [
  {
    id: "1",
    number: "SH-240001",
    date: "2024-08-10",
    recipient: "ООО Рога и Копыта",
    recipientAddress: "г. Москва, ул. Ленина, д. 1",
    status: "delivered" as const,
    responsiblePerson: "Сидоров С.С.",
    equipment: [
      {
        equipmentId: "2",
        name: "HP LaserJet Pro 400",
        serialNumber: "HP400-001",
        quantity: 1
      }
    ],
    stacks: [
      {
        stackId: "1",
        name: "Комплект разработчика",
        equipmentIds: ["1", "3", "6", "7"],
        quantity: 1
      }
    ],
    totalItems: 5,
    comments: "Срочная доставка",
    createdAt: "2024-08-10T09:00:00Z",
    deliveredAt: "2024-08-10T15:30:00Z",
    checklist: [
      {
        id: "1",
        title: "Проверить упаковку оборудования",
        description: "Убедиться в целостности упаковки",
        isCompleted: true,
        completedBy: "Сидоров С.С.",
        completedAt: "2024-08-10T09:15:00Z",
        isRequired: true
      },
      {
        id: "2",
        title: "Сверить серийные номера",
        description: "Проверить соответствие серийных номеров",
        isCompleted: true,
        completedBy: "Сидоров С.С.",
        completedAt: "2024-08-10T09:20:00Z",
        isRequired: true
      },
      {
        id: "3",
        title: "Проверить комплектность стеков",
        description: "Убедиться в наличии всего оборудования в стеках",
        isCompleted: true,
        completedBy: "Сидоров С.С.",
        completedAt: "2024-08-10T09:25:00Z",
        isRequired: true
      },
      {
        id: "4",
        title: "Загрузить в транспорт",
        description: "Аккуратно разместить в транспортном средстве",
        isCompleted: true,
        completedBy: "Сидоров С.С.",
        completedAt: "2024-08-10T09:45:00Z",
        isRequired: true
      },
      {
        id: "5",
        title: "Оформить документы",
        description: "Заполнить необходимые документы",
        isCompleted: true,
        completedBy: "Сидоров С.С.",
        completedAt: "2024-08-10T10:00:00Z",
        isRequired: true
      }
    ],
    rental: [
      {
        id: "1",
        equipment: "Звуковая система JBL",
        quantity: 2,
        link: "https://example.com/jbl-sound"
      },
      {
        id: "2", 
        equipment: "Сценические светильники",
        quantity: 8,
        link: "https://example.com/stage-lights"
      }
    ]
  },
  {
    id: "2",
    number: "SH-240002",
    date: "2024-08-12",
    recipient: "ИП Иванов",
    recipientAddress: "г. СПб, Невский пр., д. 50",
    status: "in-transit" as const,
    responsiblePerson: "Петров П.П.",
    equipment: [
      {
        equipmentId: "5",
        name: "iPhone 14 Pro",
        serialNumber: "IPH14-001",
        quantity: 2
      }
    ],
    stacks: [],
    totalItems: 2,
    createdAt: "2024-08-12T10:00:00Z",
    checklist: [
      {
        id: "6",
        title: "Проверить антистатическую упаковку",
        description: "Убедиться в защите от статики",
        isCompleted: true,
        completedBy: "Петров П.П.",
        completedAt: "2024-08-12T10:15:00Z",
        isRequired: true
      },
      {
        id: "7",
        title: "Упаковать кабели отдельно",
        description: "Аккуратно упаковать все кабели",
        isCompleted: true,
        completedBy: "Петров П.П.",
        completedAt: "2024-08-12T10:20:00Z",
        isRequired: true
      },
      {
        id: "8",
        title: "Загрузить в транспорт",
        description: "Аккуратно разместить в транспортном средстве",
        isCompleted: false,
        isRequired: true
      },
      {
        id: "9",
        title: "Закрепить груз",
        description: "Обеспечить надежное крепление груза",
        isCompleted: false,
        isRequired: true
      },
      {
        id: "10",
        title: "Оформить документы",
        description: "Заполнить необходимые документы",
        isCompleted: false,
        isRequired: true
      }
    ],
    rental: [
      {
        id: "3",
        equipment: "Проектор EPSON",
        quantity: 1,
        link: ""
      }
    ]
  }
];