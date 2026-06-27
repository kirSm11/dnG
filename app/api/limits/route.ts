import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllLimits, setLimit } from "@/lib/models";
import { mockCategoryLimits } from "@/lib/mock-data";

const setLimitSchema = z.object({
  categoryId: z.string().min(1),
  limit: z.number().min(0),
});

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const limits = await getAllLimits();
      return NextResponse.json(limits);
    } catch {
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockCategoryLimits);
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
    const body = await request.json();
    const parsed = setLimitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const limit = await setLimit(parsed.data.categoryId, parsed.data.limit);
    return NextResponse.json(limit);
  } catch {
    return NextResponse.json(
      { error: "Ошибка установки лимита" },
      { status: 500 }
    );
  }
}