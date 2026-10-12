"use client";

import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { RefreshCcw, Search, Filter, X, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/button";
import { CourseCountContext } from "../../_context/CourseCountContext";
import { useCoursePolling } from "../../_hooks/useCoursePolling";
import CourseCard from "./CourseCard";

const ITEMS_PER_PAGE = 6;

function CourseList() {
    const { user } = useUser();
    const [courseList, setCourseList] = useState([]);
    const [loading, setLoading] = useState(false);
    const { setTotalCourses } = useContext(CourseCountContext);
    const previousCourseList = useRef([]);

    // Search, Filter & Pagination states
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [difficultyFilter, setDifficultyFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);

    const getCourseList = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            if (!user?.primaryEmailAddress?.emailAddress) {
                return;
            }

            const result = await axios.post("/api/courses", {
                createdBy: user.primaryEmailAddress.emailAddress,
            });

            const newCourseList = result.data.result || [];
            if (previousCourseList.current.length > 0) {
                newCourseList.forEach(newCourse => {
                    const oldCourse = previousCourseList.current.find(c => c.courseId === newCourse.courseId);
                    if (oldCourse && oldCourse.status === "Generating" && newCourse.status === "Ready") {
                        toast.success(`Course "${newCourse.courseLayout?.course_title || newCourse.topic}" is ready!`);
                    }
                });
            }

            previousCourseList.current = newCourseList;
            setCourseList(newCourseList);
            setTotalCourses(newCourseList.length);
        } catch (error) {
            console.error("Error fetching courses:", error.response?.data || error.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [user, setTotalCourses]);

    useEffect(() => {
        if (user) {
            getCourseList();
        }
    }, [user, getCourseList]);

    useEffect(() => {
        const handleFocus = () => {
            getCourseList(false);
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [getCourseList]);

    const handleCourseDeleted = (deletedCourseId) => {
        setCourseList(prevCourses =>
            prevCourses.filter(course => course.courseId !== deletedCourseId)
        );
        setTotalCourses(prevCount => Math.max(0, prevCount - 1));
    };

    const isPolling = useCoursePolling(() => getCourseList(false), courseList);

    // Filter and search courses
    const filteredCourses = useMemo(() => {
        return courseList.filter(course => {
            const layout = typeof course.courseLayout === 'string'
                ? (() => { try { return JSON.parse(course.courseLayout); } catch (_) { return {}; } })()
                : (course.courseLayout || {});

            const title = (layout?.course_title || course.topic || "").toLowerCase();
            const topic = (course.topic || "").toLowerCase();
            const summary = (layout?.course_summary || "").toLowerCase();
            const query = searchQuery.trim().toLowerCase();

            // Search query match
            const matchesSearch = !query || title.includes(query) || topic.includes(query) || summary.includes(query);

            // Type filter
            const matchesType = typeFilter === "ALL" || (course.courseType || "").toLowerCase() === typeFilter.toLowerCase();

            // Status filter
            const matchesStatus = statusFilter === "ALL" || (course.status || "").toLowerCase() === statusFilter.toLowerCase();

            // Difficulty filter
            const matchesDifficulty = difficultyFilter === "ALL" || (course.difficulty || "").toLowerCase() === difficultyFilter.toLowerCase();

            return matchesSearch && matchesType && matchesStatus && matchesDifficulty;
        });
    }, [courseList, searchQuery, typeFilter, statusFilter, difficultyFilter]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE));
    const paginatedCourses = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredCourses.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredCourses, currentPage]);

    // Reset pagination when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, typeFilter, statusFilter, difficultyFilter]);

    const clearFilters = () => {
        setSearchQuery("");
        setTypeFilter("ALL");
        setStatusFilter("ALL");
        setDifficultyFilter("ALL");
    };

    const hasActiveFilters = searchQuery !== "" || typeFilter !== "ALL" || statusFilter !== "ALL" || difficultyFilter !== "ALL";

    return (
        <div className="mt-8 space-y-6">
            {/* Header + Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="font-bold text-2xl text-gray-900">Your Study Material</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {courseList.length} total courses in your library
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    {isPolling && (
                        <span className="text-xs text-blue-600 flex items-center gap-1 font-medium bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                            <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                            Auto-updating
                        </span>
                    )}
                    <Button onClick={() => getCourseList(true)} variant="outline" size="sm" className="flex items-center gap-1.5">
                        <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search courses by title, topic, or keyword..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="text-xs font-medium border rounded-xl px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Study Types</option>
                            <option value="Exam">Exam</option>
                            <option value="Job Interview">Job Interview</option>
                            <option value="Practice">Practice</option>
                            <option value="Coding Prep">Coding Prep</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-xs font-medium border rounded-xl px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="Ready">Ready</option>
                            <option value="Generating">Generating</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>

                        {/* Difficulty Filter */}
                        <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="text-xs font-medium border rounded-xl px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Difficulties</option>
                            <option value="Easy">Easy</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Hard">Hard</option>
                        </select>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1.5 flex items-center gap-1 transition-colors"
                            >
                                <X className="w-3 h-3" /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter counts feedback */}
                <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                    <span>
                        Showing {paginatedCourses.length} of {filteredCourses.length} courses
                        {filteredCourses.length !== courseList.length && ` (filtered from ${courseList.length})`}
                    </span>
                    {totalPages > 1 && (
                        <span>Page {currentPage} of {totalPages}</span>
                    )}
                </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!loading ? (
                    paginatedCourses.length > 0 ? (
                        paginatedCourses.map((course) => (
                            <CourseCard
                                course={course}
                                key={course.id || course.courseId}
                                onCourseDeleted={handleCourseDeleted}
                                onCourseUpdated={() => getCourseList(false)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-16 bg-white rounded-2xl border text-center p-8">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="font-bold text-gray-800 text-lg">No courses found</h3>
                            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                                {hasActiveFilters
                                    ? "No courses matched your search or filters. Try adjusting your query."
                                    : "You haven't generated any study courses yet. Click 'Create New' to get started!"}
                            </p>
                            {hasActiveFilters && (
                                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                                    Reset Filters
                                </Button>
                            )}
                        </div>
                    )
                ) : (
                    [1, 2, 3, 4, 5, 6].map((_, index) => (
                        <div className="h-56 w-full bg-slate-200 rounded-2xl animate-pulse" key={index} />
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1"
                    >
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>
                    <div className="flex items-center gap-1 text-sm font-medium">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                                    pageNum === currentPage
                                        ? "bg-blue-600 text-white"
                                        : "hover:bg-gray-100 text-gray-700"
                                }`}
                            >
                                {pageNum}
                            </button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default CourseList;
