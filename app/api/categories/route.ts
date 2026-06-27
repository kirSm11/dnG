import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllCategories, createCategory, deleteCategory } from "@/lib/models";
import { mockCategories } from "@/lib/mock-data";

const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(["expense", "income"]),
  icon: z.string().min(1),
});

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const categories = await getAllCategories();
      return NextResponse.json(categories);
    } catch (error) {
      console.error("Ошибка получения категорий:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockCategories);
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
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const category = await createCategory({
      id: crypto.randomUUID(),
      name: parsed.data.name,
      type: parsed.data.type,
      icon: parsed.data.icon,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания категории:", error);
    return NextResponse.json(
      { error: "Ошибка создания категории" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления категории:", error);
    return NextResponse.json(
      { error: "Ошибка удаления категории" },
      { status: 500 }
    );
  }
}