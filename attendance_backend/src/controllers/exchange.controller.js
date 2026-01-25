const ClassExchangeRequest = require("../models/classExchangeRequest");
const TimetableOverride = require("../models/timetableOverride");
const mongoose = require("mongoose");

/**
 * Request Exchange
 * POST /api/exchange/request
 */
exports.requestExchange = async (req, res) => {
    try {
        const { targetTeacherId, slot1, slot2 } = req.body;
        // slot1: { timetableId, date } // Requester's slot
        // slot2: { timetableId, date } // Target's slot

        // Validate details...

        const request = new ClassExchangeRequest({
            requesterId: req.body.requesterId, // from auth
            targetTeacherId,
            slot1,
            slot2,
            expiry: new Date(Date.now() + 24*60*60*1000) // 24h expiry
        });

        await request.save();
        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Respond to Request
 * POST /api/exchange/respond
 */
exports.respondToExchange = async (req, res) => {
    try {
        const { requestId, status } = req.body; // status: APPROVED / REJECTED

        const request = await ClassExchangeRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: "Request not found" });
        
        if (request.status !== "PENDING") return res.status(400).json({ message: "Request already processed" });

        request.status = status;
        await request.save();

        if (status === "APPROVED") {
            // Create Overrides
            // 1. Requester (Teacher A) -> Goes to Slot 2 (Teacher B's original slot)
            // But wait, the override logic for "Slot 2" should say "Modified Teacher = Teacher A"
            // And "Slot 1" should say "Modified Teacher = Teacher B"

            const override1 = new TimetableOverride({
                timetableId: request.slot1.timetableId,
                date: request.slot1.date,
                modifiedTeacherId: request.targetTeacherId, // Req's slot taken by Target
                reason: "Class Exchange"
            });

            const override2 = new TimetableOverride({
                timetableId: request.slot2.timetableId,
                date: request.slot2.date,
                modifiedTeacherId: request.requesterId, // Target's slot taken by Req
                reason: "Class Exchange"
            });

            await Promise.all([override1.save(), override2.save()]);
        }

        res.status(200).json({ message: `Exchange ${status}` });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
