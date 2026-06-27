import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllCards, createCard, updateCard } from "@/lib/models";
import { mockCards } from "@/lib/mock-data";

const createCardSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().min(1),
  lastFourDigits: z
    .string()
    .length(4)
    .regex(/^\d{4}$/),
  balance: z.number().default(0),
});

const updateCardSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().min(1).optional(),
  lastFourDigits: z
    .string()
    .length(4)
    .regex(/^\d{4}$/)
    .optional(),
});

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const cards = await getAllCards();
      return NextResponse.json(cards);
    } catch (error) {
      console.error("Ошибка получения карт:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockCards);
}

export async function POST(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const card = await createCard({
      name: parsed.data.name,
      color: parsed.data.color,
      lastFourDigits: parsed.data.lastFourDigits,
      balance: parsed.data.balance,
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания карты:", error);
    return NextResponse.json(
      { error: "Ошибка создания карты" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Параметр id обязателен" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const card = await updateCard(id, parsed.data);
    return NextResponse.json(card);
  } catch (error) {
    console.error("Ошибка обновления карты:", error);
    return NextResponse.json(
      { error: "Ошибка обновления карты" },
      { status: 500 }
    );
  }
}
