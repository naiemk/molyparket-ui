import { Pool } from "@/types/pool"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "./ui/button";
import { useErc20 } from "web3-react-ui";
import { Bell, User } from "lucide-react";

export default function PoolCard({ pool, chainId, tokenContract, fav, favClicked }: { pool: Pool, chainId: string, tokenContract: string,
        fav: boolean, favClicked: (poolId: string) => void
 }) {
    const { toHumanReadable } = useErc20(tokenContract, chainId);
    const volume = toHumanReadable(pool.collateral || "0");
    const percentage = 100n * BigInt(pool.totalSupplyYes) / (BigInt(pool.totalSupplyYes) + BigInt(pool.totalSupplyNo));
    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        favClicked(pool.id)
      }

    return (
        <Link key={pool.id} href={`/market/${pool.id}`} className="block">
        <Card className="hover:border-primary transition-colors duration-200 h-full">
            <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-start space-x-3 mb-3">
                <Avatar className="w-8 h-8">
                <AvatarImage src={pool.logoUrl || "/placeholder.svg"} />
                <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2">{pool.title}</h3>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-foreground">{percentage}%</span>
                <span className="text-xs text-muted-foreground">chance</span>
            </div>

            <div className="mt-auto">
                <div className="space-y-2 mb-4">
                    <div className="flex space-x-2">
                    <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                        Buy Yes ↗
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10 bg-transparent"
                    >
                        Buy No ↘
                    </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{volume}</span>
                <div className="flex items-center space-x-2">
                    <button
                    onClick={(e) => handleToggleFavorite(e)}
                    className="p-1 hover:text-primary"
                    aria-label="Toggle favorite"
                    >
                    <Bell
                        className={`w-3.5 h-3.5 transition-colors ${
                        fav ? "fill-current text-primary" : ""
                        }`}
                    />
                    </button>
                    <User className="w-3.5 h-3.5" />
                </div>
                </div>
            </div>
            </CardContent>
        </Card>
        </Link>
    )
}