import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon, RefreshCw, ArrowUpDown } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

interface LenderOption {
  lender: string;
  fixed_apr: string;
  loan_term: string;
  loan_amount: string;
  requirements: string;
}

interface ParsedLenderOption extends Omit<LenderOption, 'requirements'> {
  requirements: string[];
  averageAPR: number;
  averageTerm: number;
}

interface RefinancingOptionsProps {
  lenders: LenderOption[];
  loanAmount: number;
  isLoading: boolean;
  onRefresh: () => void;
  useDummyData: boolean;
  onToggleDummyData: () => void;
}

const parseRequirements = (requirementsString: string): string[] => {
  try {
    let cleanedString = requirementsString.trim().replace(/^['"]|['"]$/g, '');
    
    if (!cleanedString.startsWith('[')) {
      cleanedString = `[${cleanedString}]`;
    }
    
    const regex = /(?:'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|\[(?:\\.|[^\]])*\]|\{(?:\\.|[^}])*\}|\S+)+/g;
    const matches = cleanedString.match(regex);
    
    if (!matches) {
      throw new Error('No valid array items found');
    }
    
    return matches.map(item => {
      item = item.trim().replace(/^\[|\]$/g, '');
      item = item.replace(/^['"]|['"]$/g, '');
      item = item.replace(/\\'/g, "'").replace(/\\"/g, '"');
      return item;
    });
  } catch (error) {
    console.error("Error parsing requirements:", error);
    return [requirementsString];
  }
};

const calculateAverage = (range: string): number => {
  const [min, max] = range.split('-').map(val => parseFloat(val));
  return (min + max) / 2;
};

const RefinancingOptions: React.FC<RefinancingOptionsProps> = ({ 
  lenders, 
  loanAmount, 
  isLoading, 
  onRefresh, 
  useDummyData, 
  onToggleDummyData 
}) => {
  const [parsedLenders, setParsedLenders] = useState<ParsedLenderOption[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: 'averageAPR' | 'averageTerm', direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const newParsedLenders = lenders.map(lender => ({
      ...lender,
      requirements: parseRequirements(lender.requirements),
      averageAPR: calculateAverage(lender.fixed_apr.replace('%', '')),
      averageTerm: calculateAverage(lender.loan_term.replace(' yrs', ''))
    }));
    setParsedLenders(newParsedLenders);
  }, [lenders]);

  const sortedLenders = React.useMemo(() => {
    let sortableLenders = [...parsedLenders];
    if (sortConfig !== null) {
      sortableLenders.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableLenders;
  }, [parsedLenders, sortConfig]);

  const requestSort = (key: 'averageAPR' | 'averageTerm') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Refinancing Options for ${loanAmount.toLocaleString()}</CardTitle>
        <div className="flex items-center space-x-4">
          <Switch
            checked={useDummyData}
            onCheckedChange={onToggleDummyData}
          />
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-[calc(100vh-300px)]">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lender</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort('averageAPR')}
                      className="hover:bg-transparent"
                    >
                      Fixed APR
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort('averageTerm')}
                      className="hover:bg-transparent"
                    >
                      Loan Term
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Requirements</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLenders.map((lender, index) => (
                  <TableRow key={index}>
                    <TableCell>{lender.lender}</TableCell>
                    <TableCell>{lender.averageAPR.toFixed(2)}%</TableCell>
                    <TableCell>{`${lender.averageTerm.toFixed(1)} yrs`}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <ul className="list-disc list-inside">
                              {lender.requirements.map((req, i) => (
                                <li key={i} className="text-sm">{req}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

export default RefinancingOptions